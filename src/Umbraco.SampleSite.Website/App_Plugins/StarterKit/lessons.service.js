angular.module('umbraco.services').factory('lessonsService', function ($http, $q, umbRequestHelper) {
       
    var service = {
            
        getLessons: function (path, baseurl) {

            //build request values with optional params
            var qs = "?path=" + path;
            if (baseurl) {
                qs += "&baseurl=" + encodeURIComponent(baseurl);
            }

            var url = umbRequestHelper.getApiUrl("lessonsApiBaseUrl", "GetLessons" + qs);

            return umbRequestHelper.resourcePromise($http.get(url), "Failed to get lessons content");
        },

        getLessonSteps: function (path, baseurl) {

            var qs = "?path=" + path;
            if (baseurl) {
                qs += "&baseurl=" + encodeURIComponent(baseurl);
            }

            var url = umbRequestHelper.getApiUrl("lessonsApiBaseUrl", "GetLessonSteps" + qs);

            return umbRequestHelper.resourcePromise($http.get(url), "Failed to get lessons content");
        }
    };

    return service;

});