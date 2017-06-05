angular.module("umbraco").controller("AGM81b046644d304191a1413398692df1d6iconconfig", function ($scope, $rootScope, $http, $timeout, assetsService, dialogService) {

    $scope.predefineIndex = '0';
    $scope.anchorHorizontalManual = '';
    $scope.anchorHorizontalAutomatic = 'center';
    $scope.anchorVerticalManual = '';
    $scope.anchorVerticalAutomatic = 'bottom';
    $scope.isAnchorHorizontalManual = true;
    $scope.isAnchorVerticalManual = true;

    $scope.initialize = function () {
        if (typeof ($scope.model.value) == 'string') {
            $scope.model.value = JSON.parse($scope.model.value);
        }

        $scope.predefineIndex = '0';
        for (var i = 1; i != $scope.predefines.length; i++) {
            if ($scope.predefines[i].image == $scope.model.value.image) {
                $scope.predefineIndex = String(i);
                break;
            }
        }
        $scope.map();
    }

    $scope.predefines = [
        {
            name: '-- Custom --',
            image: '',
            shadowImage: '',
            size: {
                width: 32,
                height: 32
            },
            anchor: {
                horizontal: 'center',
                vertical: 'bottom'
            }
        },
        {
            name: 'Red Marker',
            image: 'https://mt.google.com/vt/icon/name=icons/spotlight/spotlight-poi.png',
            shadowImage: '',
            size: {
                width: 22,
                height: 40
            },
            anchor: {
                horizontal: 'center',
                vertical: 'bottom'
            }
        },
        {
            name: 'Green Marker',
            image: 'https://mt.google.com/vt/icon?psize=30&font=fonts/arialuni_t.ttf&color=ff304C13&name=icons/spotlight/spotlight-waypoint-a.png&ax=43&ay=48&text=%E2%80%A2',
            shadowImage: '',
            size: {
                width: 22,
                height: 43
            },
            anchor: {
                horizontal: 'center',
                vertical: 'bottom'
            }
        }
    ];

    $scope.bindPredefines = function (index) {
        $scope.model.value.name = $scope.predefines[index].name;
        $scope.model.value.image = $scope.predefines[index].image;
        $scope.model.value.shadowImage = $scope.predefines[index].shadowImage;
        $scope.model.value.size = $scope.predefines[index].size;
        $scope.model.value.anchor = $scope.predefines[index].anchor;
    }

    $scope.map = function (index) {
        if (typeof (index) === 'undefined') {
            index = Number($scope.predefineIndex);
        }

        if (index < 0 || index >= $scope.predefines.length) {
            index = 0;
        }

        if (index != 0) {
            $scope.bindPredefines(index);
        } else {
            if (typeof ($scope.model.value.name) === 'undefined') {
                $scope.model.value.name = $scope.predefines[index].name;
            }
            if (typeof ($scope.model.value.image) === 'undefined') {
                $scope.model.value.image = $scope.predefines[index].image;
            }
            if (typeof ($scope.model.value.shadowImage) === 'undefined') {
                $scope.model.value.shadowImage = $scope.predefines[index].shadowImage;
            }
            if (typeof ($scope.model.value.size) === 'undefined') {
                $scope.model.value.size = $scope.predefines[index].size;
            }
            if (typeof ($scope.model.value.anchor) === 'undefined') {
                $scope.model.value.anchor = $scope.predefines[index].anchor;
            }
        }

        if (isNaN($scope.model.value.anchor.horizontal)) {
            $scope.isAnchorHorizontalManual = false;
            $scope.anchorHorizontalManual = '';
            $scope.anchorHorizontalAutomatic = $scope.model.value.anchor.horizontal;
        } else {
            $scope.isAnchorHorizontalManual = true;
            $scope.anchorHorizontalManual = $scope.model.value.anchor.horizontal;
            $scope.anchorHorizontalAutomatic = 'center';
        }

        if (isNaN($scope.model.value.anchor.vertical)) {
            $scope.isAnchorVerticalManual = false;
            $scope.anchorVerticalManual = '';
            $scope.anchorVerticalAutomatic = $scope.model.value.anchor.vertical;
        } else {
            $scope.isAnchorVerticalManual = true;
            $scope.anchorVerticalManual = $scope.model.value.anchor.vertical;
            $scope.anchorVerticalAutomatic = 'bottom';
        }
        $scope.removeBlankOptions();
    }



    $scope.setPredefine = function () {
        if ($scope.predefineIndex == '0') {
            $scope.bindPredefines(0);
        }
        $scope.map();
    }

    $scope.removeBlankOptions = function () {
        $timeout(function () {
            if (jQuery('.angulargoolemapsConfigIcon option[value*="?"]').length != 0) {
                jQuery('.angulargoolemapsConfigIcon option[value*="?"]').remove();
            }
        });
    }
    $scope.setHorizontal = function () {
        if ($scope.isAnchorHorizontalManual) {
            $scope.model.value.anchor.horizontal = $scope.anchorHorizontalManual;
        } else {
            $scope.anchorHorizontalManual = '';
            $scope.model.value.anchor.horizontal = $scope.anchorHorizontalAutomatic;
        }
        $scope.predefineIndex = '0';
        $scope.removeBlankOptions();
    }

    $scope.setVertical = function () {
        if ($scope.isAnchorVerticalManual) {
            $scope.model.value.anchor.vertical = $scope.anchorVerticalManual;
        } else {
            $scope.anchorVerticalManual = '';
            $scope.model.value.anchor.vertical = $scope.anchorVerticalAutomatic;
        }
        $scope.predefineIndex = '0';
        $scope.removeBlankOptions();
    }



});
