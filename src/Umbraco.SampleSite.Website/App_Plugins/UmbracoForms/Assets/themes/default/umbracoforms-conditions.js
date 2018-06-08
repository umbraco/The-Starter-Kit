var umbracoForms = umbracoForms || {};
umbracoForms.conditions = function(form, fieldsetConditions, fieldConditions, values) {

    //our conditions "class" - must always be newed to work as it uses a form instance to operate on
    //load all the information from the dom and serverside info and then the class will take care of the rest

    var _this = {};
    _this.form = form;
    _this.fieldsetConditions = fieldsetConditions;
    _this.fieldConditions = fieldConditions;
    _this.values = values;

    //Iterates through all the form elements found on the page to update the registered value
    function PopulateFieldValues(page, formValues) {

        $("select", page).each(function() {
            formValues[$(this).attr("id")] = $("option[value='" + $(this).val() + "']", $(this)).text();
        });

        $("textarea", page).each(function() {
            formValues[$(this).attr("id")] = $(this).val();
        });

        // clear out all saved checkbox values to we can safely append
        $('input[type=checkbox]', page).each(function() {
            formValues[$(this).attr("name")] = null;
        });

        $("input", page).each(function() {

            if ($(this).attr('type') == "text" || $(this).attr("type") == "hidden") {
                formValues[$(this).attr("id")] = $(this).val();
            }

            if ($(this).attr('type') == "radio") {
                if ($(this).is(':checked')) {
                    formValues[$(this).attr("name")] = $(this).val();
                }
            }

            if ($(this).attr('type') == "checkbox") {
                if ($(this).attr('id') != $(this).attr('name')) {
                    if ($(this).is(':checked')) {
                        if (formValues[$(this).attr("name")] == null) {
                            formValues[$(this).attr("name")] = $(this).val();
                        } else {
                            formValues[$(this).attr("name")] += "," + $(this).val();
                        }
                    }
                } else {
                    formValues[$(this).attr("name")] = $(this).is(':checked').toString();
                }
            }
        });
    }

    /* Public api */

    _this.operators = {
        Is: function(value, expected) {
            if ((value || "") === expected) {
                return true;
            }
            var values = value.split(',');
            var matchingExpected = $.grep(values,
                function(o) {
                    return o === expected;
                });
            return matchingExpected.length > 0;
        },
        IsNot: function(value, unexpected) {
            var values = value.split(',');
            var matchingUnexpected = $.grep(values,
                function(o) {
                    return o === unexpected;
                });
            return (value || "") !== unexpected && matchingUnexpected.length === 0;
        },
        GreaterThen: function(value, limit) {
            return parseInt(value) > parseInt(limit);
        },
        LessThen: function(value, limit) {
            return parseInt(value) < parseInt(limit);
        },
        StartsWith: function(value, criteria) {
            return value && value.indexOf(criteria) === 0;
        },
        EndsWith: function(value, criteria) {
            return value && value.indexOf(criteria) === value.length - criteria.length;
        },
        Contains: function(value, criteria) {
            return value && value.indexOf(criteria) > -1;
        }
    };

    _this.watch = function() {

        //subscribe to change events
        $("input, textarea, select", _this.form).change(function() {
            PopulateFieldValues(_this.form, _this.values);

            //process the conditions
            _this.run();
        });

        //register all values from the current fields on the page
        PopulateFieldValues(_this.form, this.values);

        //the initial run-through of all the conditions
        _this.run();
    };

    _this.run = function() {
        var fsId,
            fieldId,

            /*
            fsConditions = params.fsConditions || {},
            fieldConditions = params.fieldConditions || {},
            values = params.values || {},*/

            cachedResults = {};

        function evaluateRuleInstance(rule) {
            var value = _this.values[rule.field],
                func = _this.operators[rule.operator],
                result = value !== null && func(value, rule.value);
            return result;
        }

        function evaluateRule(rule) {
            var dependencyIsVisible = true;

            if (_this.fieldConditions[rule.field]) {
                dependencyIsVisible = isVisible(rule.field, _this.fieldConditions[rule.field]);
            }

            if (dependencyIsVisible) {
                return evaluateRuleInstance(rule);
            } else {
                return false;
            }
        }

        function evaluateCondition(id, condition) {
            // This was once pretty. Now it needs refactoring again. :)

            var any = condition.logicType === "Any",
                all = condition.logicType === "All",
                fieldsetVisibilities = {},
                hasHiddenFieldset = false,
                success = true,
                rule,
                i;

            for (i = 0; i < condition.rules.length; i++) {
                rule = condition.rules[i];

                if (id === rule.field || id === rule.fieldsetId) {
                    throw new Error("Field or fieldset " + id + " has a condition on itself.");
                }

                if (fieldsetVisibilities[rule.fieldsetId] !== undefined) {
                    continue;
                }

                if (_this.fieldsetConditions[rule.fieldsetId]) {

                    fieldsetVisibilities[rule.fieldsetId] =
                        isVisible(rule.fieldsetId, _this.fieldsetConditions[rule.fieldsetId]);

                    if (!fieldsetVisibilities[rule.fieldsetId]) {
                        hasHiddenFieldset = true;
                    }
                } else {
                    fieldsetVisibilities[rule.fieldsetId] = true;
                }
            }

            if (all && hasHiddenFieldset) {
                return false;
            }

            for (i = 0; i < condition.rules.length; i++) {
                rule = condition.rules[i];

                if (fieldsetVisibilities[rule.fieldsetId]) {
                    success = evaluateRule(condition.rules[i]);
                } else {
                    success = false;
                }

                if (any && success) {
                    break;
                }
                if (all && !success) {
                    break;
                }
            }
            return success;
        }

        function evaluateConditionVisibility(id, condition) {
            var show = condition.actionType === "Show",
                cachedResult = cachedResults[id],
                success = cachedResult === undefined
                    ? (cachedResults[id] = evaluateCondition(id, condition))
                    : cachedResult,
                visible = !(success ^ show);
            return visible;
        }

        function isVisible(id, condition) {
            if (condition) {
                return evaluateConditionVisibility(id, condition);
            }
            return true;
        }

        function handleCondition(element, id, condition, type) {
            var shouldShow = isVisible(id, condition);
            if (shouldShow) {
                element.show();
            } else {
                element.hide();
            }
        }

        for (fsId in _this.fieldsetConditions) {
            handleCondition($("#" + fsId), fsId, _this.fieldsetConditions[fsId], "Fieldset");
        }

        for (fieldId in _this.fieldConditions) {
            handleCondition($("#" + fieldId).closest(".umbraco-forms-field"),
                fieldId,
                _this.fieldConditions[fieldId],
                "Field");
        }
    }

    return _this;
}