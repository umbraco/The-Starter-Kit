(function() {

    //execute init() on document ready
    if (document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll)) {
        listen();
    } else {
        document.addEventListener("DOMContentLoaded", listen);
    }

    function listen() {
        if (typeof umbracoFormsLocale === "undefined") {
            //this will occur if this js file is loaded before the inline scripts, in which case
            //we'll listen for the inline scripts to execute a custom event.
            document.addEventListener("umbracoFormsLocaleLoaded", init);
        }
        else {
            init({umbracoFormsLocale: umbracoFormsLocale});
        }
    }

    function init(e) {

        if (typeof moment === "undefined") {
            throw "moment lib has not been loaded";
        }

        moment.locale(e.umbracoFormsLocale.name);

        var datePickerFields = document.getElementsByClassName('datepickerfield');
        for (var i = 0; i < datePickerFields.length; i++) {
            var field = datePickerFields[i];
            var currentId = field.id;
            new Pikaday({
                field: document.getElementById(currentId),
                yearRange: e.umbracoFormsLocale.datePickerYearRange,
                i18n: e.umbracoFormsLocale.locales,
                format: "LL",
                onSelect: function (date) {
                    setShadow(currentId.replace("_1", ""), date);
                },
                minDate: new Date('1753-01-01T00:00:00') //Min value of datetime in SQL Server CE
            });
        }

        function setShadow(id, date) {
            var value = moment(date).format('YYYY-MM-DD');
            var field = document.getElementById(id);
            field.value = value;
        }
    }

})();

