var umbracoForms = umbracoForms || {};

/*
    Umbraco Forms - Dependencies Checker
*/
umbracoForms.dependencyCheck = function (formId) {

    //Only perform check if the global 'Umbraco.Sys' is null/undefined
    //If present means we are in backoffice & that this is being rendered as a macro preview
    //We do not need to perform this check here
    if (typeof Umbraco !== 'undefined' && typeof Umbraco.Sys !== 'undefined') {
        return;
    }
    else {

        //Select the wrapping div around the form 
        //umbraco_form_GUID
        var formEl = document.getElementById('umbraco_form_' + formId);

        var errorElement = document.createElement('div');
        errorElement.className = 'umbraco-forms missing-library';
        errorElement.style.color = '#fff';
        errorElement.style.backgroundColor = '#9d261d';
        errorElement.style.padding = '15px';
        errorElement.style.margin = '10px 0';
        var errorMessage = "";

        //Ensure umbracoForm is not null
        if (formEl) {

            //Check to see if the message for the form has been inserted already
            var checkForExistinhgErr = formEl.getElementsByClassName('umbraco-forms missing-library');
            if(checkForExistinhgErr.length > 0){
                return;
            }

            //Check for jQuery
            if (typeof jQuery == 'undefined') {
                errorMessage = errorMessage + 'jQuery has not been loaded & is required for Umbraco Forms.';
            } else {
                //These only work if jQuery is present, so it's in the else block

                //Check for jQuery Validation
                if (!$.validator) {
                    errorMessage = errorMessage + '<br />jQuery Validate has not been loaded & is required for Umbraco Forms.'
                }

                //Check for jQuery Validation Unobtrusive
                //Only works if jQuery validator has been loaded
                if ($.validator && !$.validator.unobtrusive) {
                    errorMessage = errorMessage + '<br />jQuery Validate Unobtrusive has not been loaded & is required for Umbraco Forms.';
                }
            }
            if (errorMessage !== "") {
                errorElement.innerHTML = errorMessage + '<br/> <a href="https://our.umbraco.org/documentation/products/umbracoforms/developer/Prepping-Frontend/" target="_blank" style="text-decoration:underline; color:#fff;">See Umbraco Forms Documentation</a>';

                formEl.insertBefore(errorElement, formEl.childNodes[0]);
            }
        }
    }

};