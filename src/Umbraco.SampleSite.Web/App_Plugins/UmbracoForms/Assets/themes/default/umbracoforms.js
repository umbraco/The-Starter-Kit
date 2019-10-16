(function () {

    //execute init() on document ready
    if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) {
        listen();
    } else {
        document.addEventListener("DOMContentLoaded", listen);
    }

    function listen() {
        if (typeof umbracoFormsCollection === "undefined") {
            //this will occur if this js file is loaded before the inline scripts, in which case
            //we'll listen for the inline scripts to execute a custom event.
            document.addEventListener("umbracoFormLoaded", init);
        }
        else {
            initCollection(umbracoFormsCollection);
        }
    }

    function initCollection(formsCollection) {
        configureUmbracoFormsValidation();

        for (var i = 0; i < formsCollection.length; i++) {
            init({ form: formsCollection[i]});
        }
    }

    function init(e) {

        var formItem = e.form;

        dependencyCheck(formItem.formId);

        var form = $('#umbraco_form_' + formItem.formId + ' .umbraco-forms-page');
        var conditions = new UmbracoFormsConditions(form,
            formItem.fieldSetConditions,
            formItem.fieldConditions,
            formItem.recordValues);
        conditions.watch();
    }

    /** Configures the jquery validation for Umbraco forms */
    function configureUmbracoFormsValidation() {
        if ($.validator !== undefined) {

            $.validator.setDefaults({
                ignore: ":hidden"
            });

            $.validator.unobtrusive.adapters.addBool("requiredcb", "required");

            $.validator.addMethod("umbracoforms_selectonefromlist", function (value, element) {
                var valid = false;
                $("input", $(element).closest(".checkboxlist, .radiobuttonlist")).each(function (i) {
                    if ($(this).is(':checked')) {
                        valid = true;
                    }
                });
                return valid;
            });

            $.validator.unobtrusive.adapters.addBool("requiredlist", "umbracoforms_selectonefromlist");

            $.validator.addMethod("umbracoforms_regex", function (value, element) {

                var regex = $(element).attr("data-regex");
                var val = $(element).val();
                if (val.length === 0) {
                    return true;
                }
                return val.match(regex);
            });

            $.validator.unobtrusive.adapters.addBool("regex", "umbracoforms_regex");

            $(".umbraco-forms-form input[type=submit]").not(".cancel").click(function (evt) {
                evt.preventDefault();
                var self = $(this);
                var frm = self.closest("form");
                frm.validate();
                if (frm.valid()) {
                    frm.submit();
                    self.attr("disabled", "disabled");

                }
            });
        }
    }

    /**
    * method to determine if Umbraco Forms can run and has the required dependencies loaded
    * @param {String} formId the id of the form
    */
    function dependencyCheck(formId) {
        //Only perform check if the global 'Umbraco.Sys' is null/undefined
        //If present means we are in backoffice & that this is being rendered as a macro preview
        //We do not need to perform this check here
        if (typeof Umbraco !== "undefined" && typeof Umbraco.Sys !== "undefined") {
            return;
        }
        else {

            //Select the wrapping div around the form 
            //umbraco_form_GUID
            var formEl = document.getElementById("umbraco_form_" + formId);

            var errorElement = document.createElement("div");
            errorElement.className = "umbraco-forms missing-library";
            errorElement.style.color = "#fff";
            errorElement.style.backgroundColor = "#9d261d";
            errorElement.style.padding = "15px";
            errorElement.style.margin = "10px 0";
            var errorMessage = "";

            //Ensure umbracoForm is not null
            if (formEl) {

                //Check to see if the message for the form has been inserted already
                var checkForExistinhgErr = formEl.getElementsByClassName('umbraco-forms missing-library');
                if (checkForExistinhgErr.length > 0) {
                    return;
                }

                //Check for jQuery
                if (typeof jQuery === "undefined") {
                    errorMessage = errorMessage + "jQuery has not been loaded & is required for Umbraco Forms.";
                } else {
                    //These only work if jQuery is present, so it's in the else block

                    //Check for jQuery Validation
                    if (!$.validator) {
                        errorMessage = errorMessage + "<br />jQuery Validate has not been loaded & is required for Umbraco Forms."
                    }

                    //Check for jQuery Validation Unobtrusive
                    //Only works if jQuery validator has been loaded
                    if ($.validator && !$.validator.unobtrusive) {
                        errorMessage = errorMessage + "<br />jQuery Validate Unobtrusive has not been loaded & is required for Umbraco Forms.";
                    }
                }
                if (errorMessage !== "") {
                    errorElement.innerHTML = errorMessage + '<br/> <a href="https://our.umbraco.org/documentation/products/umbracoforms/developer/Prepping-Frontend/" target="_blank" style="text-decoration:underline; color:#fff;">See Umbraco Forms Documentation</a>';

                    formEl.insertBefore(errorElement, formEl.childNodes[0]);
                }
            }
        }
    }

    /**
     * Class to handle Umbraco Forms conditional statements
     * @param {any} form a reference to the form
     * @param {any} fieldsetConditions a reference to the fieldset conditions
     * @param {any} fieldConditions a reference to the field conditions
     * @param {any} values the form values
     * @return {Object} reference to the created class
     */
    function UmbracoFormsConditions(form, fieldsetConditions, fieldConditions, values) {

        //our conditions "class" - must always be newed to work as it uses a form instance to operate on
        //load all the information from the dom and serverside info and then the class will take care of the rest

        var self = {};
        self.form = form;
        self.fieldsetConditions = fieldsetConditions;
        self.fieldConditions = fieldConditions;
        self.values = values;
        self.dataTypes = {};
        
        //Iterates through all the form elements found on the page to update the registered value
        function populateFieldValues(page, formValues, dataTypes) {

            $("select", page).each(function () {
                formValues[$(this).attr("id")] = $("option[value='" + $(this).val() + "']", $(this)).text();
                dataTypes[$(this).attr("id")] = "select";
            });

            $("textarea", page).each(function () {
                formValues[$(this).attr("id")] = $(this).val();
                dataTypes[$(this).attr("id")] = "textarea";
            });

            // clear out all saved checkbox values to we can safely append
            $("input[type=checkbox]", page).each(function () {
                formValues[$(this).attr("name")] = null;
                dataTypes[$(this).attr("id")] = "checkbox";
            });

            $("input", page).each(function () {

                if ($(this).attr('type') === "text" || $(this).attr("type") === "hidden") {
                    formValues[$(this).attr("id")] = $(this).val();
                    dataTypes[$(this).attr("id")] = "text";
                }

                if ($(this).attr('type') === "radio") {
                    if ($(this).is(':checked')) {
                        formValues[$(this).attr("name")] = $(this).val();
                        dataTypes[$(this).attr("id")] = "radio";
                    }
                }

                if ($(this).attr("type") === "checkbox") {
                    if ($(this).attr("id") !== $(this).attr("name")) {
                        if ($(this).is(":checked")) {
                            if (formValues[$(this).attr("name")] === null) {
                                formValues[$(this).attr("name")] = $(this).val();
                            }
                            else {
                                formValues[$(this).attr("name")] += "," + $(this).val();
                            }
                        }
                    }
                    else {
                        formValues[$(this).attr("name")] = ($(this).is(":checked") ? "true" : "false");
                    }
                }
            });
        }

        /* Public api */

        self.operators = {
            Is: function (value, expected, dataType) {
                if ((value || "") === expected) {
                    return true;
                }
                if(value == null){
                    return (expected == value);
                }

                if(dataType === "checkbox"){
                    if(expected.toUpperCase() === "TRUE" || expected.toUpperCase() === "ON"){
                        expected = "true"
                    }else if(expected.toUpperCase() === "FALSE" || expected.toUpperCase() === "OFF"){
                        expected = "false"
                    }
                }
                
                var values = value.split(',');
                var matchingExpected = $.grep(values,
                    function (o) {
                        return o === expected;
                    });
                return matchingExpected.length > 0;
            },
            IsNot: function (value, unexpected, dataType) {
                if(value == null){
                    return (unexpected != value);
                }
                var values = value.split(',');
                var matchingUnexpected = $.grep(values,
                    function (o) {
                        return o === unexpected;
                    });

                if(dataType === "checkbox"){
                    if(unexpected.toUpperCase() === "TRUE"|| unexpected.toUpperCase() === "ON"){
                        unexpected = "true"
                    }else if(unexpected.toUpperCase() === "FALSE" || unexpected.toUpperCase() === "OFF"){
                        unexpected = "false"
                    }
                }
                return (value || "") !== unexpected && matchingUnexpected.length === 0;
            },
            GreaterThen: function (value, limit, dataType) {
                return parseInt(value) > parseInt(limit);
            },
            LessThen: function (value, limit, dataType) {
                return parseInt(value) < parseInt(limit);
            },
            StartsWith: function (value, criteria, dataType) {
                return value && value.indexOf(criteria) === 0;
            },
            EndsWith: function (value, criteria, dataType) {
                return value && value.indexOf(criteria) === value.length - criteria.length;
            },
            Contains: function (value, criteria, dataType) {
                return value && value.indexOf(criteria) > -1;
            }
        };

        self.watch = function () {

            //subscribe to change events
            $("input, textarea, select", self.form).change(function () {
                populateFieldValues(self.form, self.values,  self.dataTypes);

                //process the conditions
                self.run();
            });

            //register all values from the current fields on the page
            populateFieldValues(self.form, self.values,  self.dataTypes);

            //the initial run-through of all the conditions
            self.run();
        };

        self.run = function () {
            var fsId,
                fieldId,

                /*
                fsConditions = params.fsConditions || {},
                fieldConditions = params.fieldConditions || {},
                values = params.values || {},*/

                cachedResults = {};

            function evaluateRuleInstance(rule) {
                var value = self.values[rule.field],
                    dataType = self.dataTypes[rule.field],
                    func = self.operators[rule.operator],
                    result = value !== null && func(value, rule.value, dataType);
                return result;
            }

            function evaluateRule(rule) {
                var dependencyIsVisible = true;

                if (self.fieldConditions[rule.field]) {
                    dependencyIsVisible = isVisible(rule.field, self.fieldConditions[rule.field]);
                }

                if (dependencyIsVisible) {
                    return evaluateRuleInstance(rule);
                }
                else {
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

                    if (self.fieldsetConditions[rule.fieldsetId]) {

                        fieldsetVisibilities[rule.fieldsetId] =
                            isVisible(rule.fieldsetId, self.fieldsetConditions[rule.fieldsetId]);

                        if (!fieldsetVisibilities[rule.fieldsetId]) {
                            hasHiddenFieldset = true;
                        }
                    }
                    else {
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
                    }
                    else {
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
                    cachedResult = cachedResults[id];
                
                    var success;
                    if(cachedResult === undefined){
                        cachedResults[id] = show; // set default value to avoid circular issues
                        success = (cachedResults[id] = evaluateCondition(id, condition));
                    }else{
                        success =    cachedResult;
                    }
           
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
                }
                else {
                    element.hide();
                }
            }

            for (fsId in self.fieldsetConditions) {
                if (self.fieldsetConditions.hasOwnProperty(fsId)) {
                    handleCondition($("#" + fsId), fsId, self.fieldsetConditions[fsId], "Fieldset");
                }
            }

            for (fieldId in self.fieldConditions) {
                if (self.fieldConditions.hasOwnProperty(fieldId)) {
                    handleCondition($("#" + fieldId).closest(".umbraco-forms-field"),
                        fieldId,
                        self.fieldConditions[fieldId],
                        "Field");
                }
            }
        };

        return self;
    }
})();