(function () {
	var KEY = '';		//	If you require more than 25,000 google map requests per day, you will need to obtain a Google Map API key from 
						//		https://developers.google.com/maps/documentation/javascript/tutorial#api_key
						//	Place it within the single quotes. Otherwise leave as empty string.

	var DOWNLOAD_TIMEOUT = 1000 * 30;	//	How long do we try and download google maps in millisecs before we give in

	//	Mock google maps, in case we fail to load
	google = {
		maps: {
			OverlayView: function () {
			},
			Marker: function () {
			},
			InfoWindow: function () {
			}
		}
	};

	//	Load dependencies
	var loadingSuccessful = null;

	//	Add ourselves to umbraco
	var agm = angular.module('AGM', ['uiGmapgoogle-maps']);
	app.requires.push('AGM');

	var failed = function () {
		loadingSuccessful = false;
		self.clearTimeout(timer);
		inject.removeChild(script);
	}

	var cachedScript = function (url, options) {
		options = $.extend(options || {}, {
			dataType: 'script',
			cache: true,
			url: url
		});
		return jQuery.ajax(options);
	};
	var apiKey = '';
	if (KEY != '') {
		apiKey = '&key=' + KEY;
	}

	cachedScript('//maps.googleapis.com/maps/api/js?v=3&sensor=true&libraries=places&callback=AGM4bf1a78e00984aebbf1b1ce0c260d6dbCallback' + apiKey).done(function (script, textStatus) {
		//	Do nothing, as google will execute our callback directly
	}).fail(function (jqxhr, settings, exception) {
		failed();
	});

	var timer = setTimeout(failed, DOWNLOAD_TIMEOUT);

	AGM4bf1a78e00984aebbf1b1ce0c260d6dbCallback = function () {
		loadingSuccessful = true;
		clearTimeout(timer);
	}

	function coordinates(coords) {
		try {
			var latlng = coords.trim().split(',');
			if (latlng.length != 3) {
				return false;
			}
			var lat = parseFloat(latlng[0]);
			if (isNaN(lat) || lat > 90 || lat < -90) {
				return false;
			}
			var lng = parseFloat(latlng[1]);
			if (isNaN(lng) || lng > 180 || lng < -180) {
				return false;
			}
			var zoom = parseInt(latlng[2]);
			if (isNaN(zoom) || zoom < 1 || zoom > 20) {
				return false;
			}

			return {
				'latitude': lat,
				'longitude': lng,
				'zoom': zoom
			};
		}
		catch (oh) {
			return false;		//	wasn't a number
		}
	}

	var getAnchorHorizontal = function (text, width)
	{
	    if (typeof text == 'string') {
	        switch (text.charAt(0)) {
	            case 'l':
	            case 'L':
	                return 0;

	            case 'c':
	            case 'C':
	            case 'm':
	            case 'M':
	                return width / 2;

	            case 'r':
	            case 'R':
	                return width - 1;
	        }
	    }
        return Number(text);
	}

	var getAnchorVertical = function (text, height)
	{
	    if (typeof text == 'string') {
	        switch (text.charAt(0)) {
	            case 't':
	            case 'T':
	                return 0;

	            case 'c':
	            case 'C':
	            case 'm':
	            case 'M':
	                return height / 2;

	            case 'b':
	            case 'B':
	                return height - 1;
	        }
	    }
        return Number(text);
	}

	function predefinedIconUrl(name) {
	    switch (name.trim().toLowerCase()) {
	        case '':
	        case 'red marker':
	        case 'marker':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/spotlight-poi.png';

	        case 'green marker':
	            return 'https://mt.google.com/vt/icon?psize=30&font=fonts/arialuni_t.ttf&color=ff304C13&name=icons/spotlight/spotlight-waypoint-a.png&ax=43&ay=48&text=%E2%80%A2';

	        case 'blue marker':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/spotlight-waypoint-blue.png';

	        case 'purple marker':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/spotlight-ad.png';

	        case 'gold star':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/star_L_8x.png&scale=2';

	        case 'grey home':
	        case 'gray home':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/home_L_8x.png&scale=2';

	        case 'red shopping cart':
	        case 'red cart':
	        case 'shopping cart':
	        case 'cart':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/supermarket_search_L_8x.png&scale=2';

	        case 'blue shopping cart':
	        case 'blue cart':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/supermarket_L_8x.png&scale=2';

	        case 'red hot spring':
	        case 'red spring':
	        case 'hot spring':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/hot_spring_search_L_8x.png&scale=2';

	        case 'green hot spring':
	        case 'green spring':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/hot_spring_L_8x.png&scale=2';

	        case 'red dharma':
	        case 'dharma':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/worship_dharma_search_L_8x.png&scale=2';

	        case 'brown dharma':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/worship_dharma_L_8x.png&scale=2';

	        case 'red jain':
	        case 'jain':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/worship_jain_search_L_8x.png&scale=2';

	        case 'brown jain':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/worship_jain_L_8x.png&scale=2';

	        case 'red shopping':
	        case 'shopping':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/shopping_search_L_8x.png&scale=2';

	        case 'blue shopping':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/shopping_L_8x.png&scale=2';

	        case 'red harbour':
	        case 'harbour':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/harbour_search_L_8x.png&scale=2';

	        case 'blue harbour':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/harbour_L_8x.png&scale=2';

	        case 'red parking':
	        case 'parking':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/parking_search_L_8x.png&scale=2';

	        case 'brown parking':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/parking_L_8x.png&scale=2';

	        case 'red shrine':
	        case 'shrine':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/shrine_search_L_8x.png&scale=2';

	        case 'brown shrine':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/shrine_L_8x.png&scale=2';

	        case 'red museum japan':
	        case 'museum japan':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/museum_japan_search_L_8x.png&scale=2';

	        case 'brown museum japan':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/museum_japan_L_8x.png&scale=2';

	        case 'red gas station':
	        case 'red petrol station':
	        case 'red gas pump':
	        case 'red petrol pump':
	        case 'gas station':
	        case 'petrol station':
	        case 'gas pump':
	        case 'petrol pump':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/gas_station_search_L_8x.png&scale=2';

	        case 'blue gas station':
	        case 'blue petrol station':
	        case 'blue gas pump':
	        case 'blue petrol pump':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/gas_station_L_8x.png&scale=2';

	        case 'red plane':
	        case 'plane':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/airport_search_L_8x.png&scale=2';

	        case 'blue plane':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/airport_L_8x.png&scale=2';

	        case 'red museum':
	        case 'museum':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/museum_search_L_8x.png&scale=2';

	        case 'brown museum':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/museum_L_8x.png&scale=2';

	        case 'red bullseye':
	        case 'bullseye':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/city_office_search_L_8x.png&scale=2';

	        case 'brown bullseye':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/city_office_L_8x.png&scale=2';

	        case 'red movie':
	        case 'movie':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/movie_search_L_8x.png&scale=2';

	        case 'blue movie':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/movie_L_8x.png&scale=2';

	        case 'red restaurant':
	        case 'restaurant':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/restaurant_search_L_8x.png&scale=2';

	        case 'orange restaurant':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/restaurant_L_8x.png&scale=2';

	        case 'red monument':
	        case 'monument':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/monument_search_L_8x.png&scale=2';

	        case 'brown monument':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/monument_L_8x.png&scale=2';

	        case 'red police japan':
	        case 'police japan':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/police_japan_search_L_8x.png&scale=2';

	        case 'brown police japan':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/police_japan_L_8x.png&scale=2';

	        case 'red post office':
	        case 'post office':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/post_office_search_L_8x.png&scale=2';

	        case 'blue post office':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/post_office_L_8x.png&scale=2';

	        case 'red cafe':
	        case 'cafe':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/cafe_search_L_8x.png&scale=2';

	        case 'orange cafe':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/cafe_L_8x.png&scale=2';

	        case 'red library':
	        case 'library':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/library_search_L_8x.png&scale=2';

	        case 'brown library':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/library_L_8x.png&scale=2';

	        case 'red star':
	        case 'star':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/cn/government_china_search_L_8x.png&scale=2';

	        case 'brown star':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/cn/government_china_L_8x.png&scale=2';

	        case 'red drink':
	        case 'drink':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/bar_search_L_8x.png&scale=2';

	        case 'orange drink':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/bar_L_8x.png&scale=2';

	        case 'red police search':
	        case 'police search':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/police_search_L_8x.png&scale=2';

	        case 'brown police search':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/police_L_8x.png&scale=2';

	        case 'red fire japan':
	        case 'fire japan':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/fire_japan_search_L_8x.png&scale=2';

	        case 'brown fire japan':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/fire_japan_L_8x.png&scale=2';

	        case 'red ancient_relic':
	        case 'ancient_relic':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/ancient_relic_search_L_8x.png&scale=2';

	        case 'brown ancient_relic':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/ancient_relic_L_8x.png&scale=2';

	        case 'red tree':
	        case 'tree':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/park_search_L_8x.png&scale=2';

	        case 'green tree':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/park_L_8x.png&scale=2';

	        case 'red toilets':
	        case 'toilets':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/wc_search_L_8x.png&scale=2';

	        case 'brown toilets':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/wc_L_8x.png&scale=2';

	        case 'red hospital':
	        case 'hospital':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/hospital_H_search_L_8x.png&scale=2';

	        case 'red dollar':
	        case 'dollar':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/bank_dollar_search_L_8x.png&scale=2';

	        case 'blue dollar':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/bank_dollar_L_8x.png&scale=2';

	        case 'red golf':
	        case 'golf':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/golf_search_L_8x.png&scale=2';

	        case 'green golf':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/golf_L_8x.png&scale=2';

	        case 'red civic building':
	        case 'civic building':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/golf_search_L_8x.png&scale=2';

	        case 'brown civic building':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/golf_L_8x.png&scale=2';

	        case 'red historic China':
	        case 'historic China':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/cn/historic_china_search_L_8x.png&scale=2';

	        case 'brown historic China':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/cn/historic_china_L_8x.png&scale=2';

	        case 'red euro':
	        case 'euro':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/bank_euro_search_L_8x.png&scale=2';

	        case 'blue euro':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/bank_euro_L_8x.png&scale=2';

	        case 'red cemetery':
	        case 'cemetery':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/cemetery_search_L_8x.png&scale=2';

	        case 'green cemetery':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/cemetery_L_8x.png&scale=2';

	        case 'red lodging':
	        case 'lodging':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/lodging_search_L_8x.png&scale=2';

	        case 'brown lodging':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/lodging_L_8x.png&scale=2';

	        case 'red post office japan':
	        case 'post office japan':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/post_office_japan_search_L_8x.png&scale=2';

	        case 'brown post office japan':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/jp/post_office_japan_L_8x.png&scale=2';

	        case 'red pound':
	        case 'pound':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/bank_pound_search_L_8x.png&scale=2';

	        case 'blue pound':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/bank_pound_L_8x.png&scale=2';

	        case 'red mountains':
	        case 'mountains':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/mountains_search_L_8x.png&scale=2';

	        case 'green mountains':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/mountains_L_8x.png&scale=2';

	        case 'red unversity':
	        case 'unversity':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/university_search_L_8x.png&scale=2';

	        case 'brown unversity':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/university_L_8x.png&scale=2';

	        case 'red tent':
	        case 'tent':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/mountains_search_L_8x.png&scale=2';

	        case 'green tent':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/mountains_L_8x.png&scale=2';

	        case 'red temple':
	        case 'temple':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/temple_search_L_8x.png&scale=2';

	        case 'brown temple':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/temple_L_8x.png&scale=2';

	        case 'red circle':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/generic_search_L_8x.png&scale=2';

	        case 'orange circle':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/ad_L_8x.png&scale=2';

	        case 'brown circle':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/generic_establishment_v_L_8x.png&scale=2';

	        case 'green circle':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/generic_recreation_v_L_8x.png&scale=2';

	        case 'blue circle':
	            return 'https://mt.google.com/vt/icon/name=icons/spotlight/generic_retail_v_L_8x.png&scale=2';

	        case 'orange roadworks':
	            return 'https://mt.google.com/vt/icon/name=icons/layers/traffic/construction_large_8x.png&scale=2';

	        case 'orange umbraco':
	            return '/Umbraco/assets/img/application/logo.png';

	        case 'black umbraco':
	            return '/Umbraco/assets/img/application/logo_black.png';

	        case 'white umbraco':
	            return '/Umbraco/assets/img/application/logo_white.png';

	        default:
	            return name;
	    }
	}

	var configIcon = function (config)
	{
	    if (typeof config === 'undefined' || typeof config.icon === 'undefined' || typeof config.icon.image === 'undefined' || String(config.icon.image).trim() == '') {
	        return {url: 'https://mt.google.com/vt/icon/name=icons/spotlight/spotlight-poi.png'};
	    } else {
	        if (typeof config.iconUrl !== 'undefined') {
	            return { url: predefinedIconUrl(config.iconUrl) };
	        } else {
	            return {
	                url: config.icon.image,
	                scaledSize: new google.maps.Size(config.icon.size.width, config.icon.size.height),
	                anchor: new google.maps.Point(getAnchorHorizontal(config.icon.anchor.horizontal, config.icon.size.width),
                        getAnchorVertical(config.icon.anchor.vertical, config.icon.size.height)),
	                shadow: config.icon.shadowImage        /* This has been deprecated */
	            }
	        }
	    }
	}

	angular.module("umbraco").run(['$templateCache', function ($templateCache) {
		$templateCache.put('AGM81b046644d304191a1413398692df1d6ctrl.tpl.html', '<input id="pac-input" class="umb-editor umb-textstring ng-scope ng-pristine ng-valid" type="text" placeholder="Search">');
	}])

	angular.module("umbraco").controller("AGM81b046644d304191a1413398692df1d6ctrl", function ($scope, $http, assetsService, dialogService) {
		var ignoreEvents = false;
		var styleColorRed = { 'color': 'red' };

		if (loadingSuccessful == true) {
			google.maps.visualRefresh = true;

			var coords = coordinates($scope.model.value);
			if (typeof coords == 'boolean') {
				$scope.model.forecolor = styleColorRed;
				coords = coordinates($scope.model.config.defaultLocation);
				if (typeof coords == 'boolean') {
					coords = coordinates("0,0,1");
				}
			}
			$scope.model.coords = coords;

			$scope.model.setValue = function () {
				$scope.model.value = $scope.model.coords.latitude + ',' + $scope.model.coords.longitude + ',' + $scope.model.coords.zoom;
				$scope.model.forecolor = {};
			}
			$scope.model.height = { 'height': '400px' };

			angular.extend($scope, {
				map: {
					control: {
					},
					showMap: true,
					center: {
						latitude: $scope.model.coords.latitude,
						longitude: $scope.model.coords.longitude
					},
					zoom: $scope.model.coords.zoom,
					refresh: function () {
						$scope.map.control.refresh({
							latitude: $scope.model.coords.latitude,
							longitude: $scope.model.coords.longitude
						});
						$scope.map.control.getGMap().setZoom($scope.model.coords.zoom);
					},
					options: {
						disableDefaultUI: false,
						panControl: true,
						navigationControl: true,
						scrollwheel: false,
						scaleControl: true
					},
					draggable: true,
					events: {
						zoom_changed: function (args) {
							if (!ignoreEvents) {
								$scope.model.coords.zoom = parseInt(args.zoom);
								$scope.model.setValue();
							}
						}
					},
					marker: {
						id: 'AGM_' + $scope.model.alias + '_marker',
						latitude: $scope.model.coords.latitude,
						longitude: $scope.model.coords.longitude,
						icon: configIcon(),
						options: {
							visible: true,
							draggable: true
						},
						events: {
							dragend: function (marker) {
								if (!ignoreEvents) {
									$scope.model.coords.latitude = marker.getPosition().lat();
									$scope.model.coords.longitude = marker.getPosition().lng();
									$scope.model.setValue();
								}
							}
						}
					}
				},
				searchbox: {
					template: 'AGM81b046644d304191a1413398692df1d6ctrl.tpl.html',
					//position:'top-right',
					position: 'top-left',
					options: {
						bounds: {}
					},
					//parentdiv:'searchBoxParent',
					events: {
						places_changed: function (searchBox) {
							places = searchBox.getPlaces()
							if (places.length == 0) {
								return;
							}

							$scope.map.control.getGMap().panTo(places[0].geometry.location);
							$scope.model.coords.latitude = $scope.map.marker.latitude = places[0].geometry.location.lat();
							$scope.model.coords.longitude = $scope.map.marker.longitude = places[0].geometry.location.lng();
							$scope.model.setValue();
							//google.maps.event.trigger($scope.map.control.getGMap(), 'resize');
							$scope.map.refresh();
						}
					}
				}

			});

			var refreshTimer = self.setInterval(function () {
				if (typeof $scope.map.control !== 'undefined' && $scope.map.control != null && typeof $scope.map.control.getGMap !== 'undefined' && $scope.map.control.getGMap() != null) {
					self.clearInterval(refreshTimer);
					google.maps.event.addListenerOnce($scope.map.control.getGMap(), 'tilesloaded', function () {
						$scope.map.refresh();
					});
				}
			}, 100);

		} else {
			//	Google maps hasn't loaded, so make coords editable and hide everything else
			$scope.model.config.hideSearch = true;
			$scope.model.hideMap = true;
			$scope.model.coordinatesBehavour_show = true;
			$scope.model.coordinatesBehavour_readonly = false;
		}

		$scope.checkCoordsTimer = null;
		$scope.checkCoords = function () {
			var coords = coordinates($scope.model.value);
			if (typeof coords == 'boolean') {
				$scope.model.forecolor = styleColorRed;
			} else {
				$scope.model.forecolor = {};
				if (loadingSuccessful == true) {
					if ($scope.checkCoordsTimer != null) {
						self.clearTimeout($scope.checkCoordsTimer);
					}
					$scope.checkCoordsTimer = self.setTimeout(function () {
						$scope.checkCoordsTimer = null;
						ignoreEvents = true;
						$scope.map.control.getGMap().panTo({ lat: coords.latitude, lng: coords.longitude });
						$scope.model.coords.latitude = $scope.map.marker.latitude = coords.latitude;
						$scope.model.coords.longitude = $scope.map.marker.longitude = coords.longitude;
						$scope.map.control.getGMap().setZoom(coords.zoom);
						ignoreEvents = false;
					}, 1000);
				}
			}
		}
	});


	AGM4bf1a78e00984aebbf1b1ce0c260d6dbCtrl = function ($rootScope, $scope, $location, notificationsService, dialogService, assetsService, $window, $element) {
		var ignoreEvents = false;
		var styleColorRed = { 'color': 'red' };

		if (loadingSuccessful == true) {
			google.maps.visualRefresh = true;

			var coords = coordinates($scope.model.value);
			if (typeof coords == 'boolean') {
				$scope.model.forecolor = styleColorRed;
				coords = coordinates($scope.model.config.defaultLocation);
				if (typeof coords == 'boolean') {
					coords = coordinates("0,0,1");
				}
			}
			$scope.model.coords = coords;

			$scope.model.setValue = function () {
				$scope.model.value = $scope.model.coords.latitude + ',' + $scope.model.coords.longitude + ',' + $scope.model.coords.zoom;
				$scope.model.forecolor = {};
			}

			switch (parseInt($scope.model.config.coordinatesBehavour)) {
				case 0:
					$scope.model.coordinatesBehavour_show = false;
					$scope.model.coordinatesBehavour_readonly = true;
					break;
				case 1:
					$scope.model.coordinatesBehavour_show = true;
					$scope.model.coordinatesBehavour_readonly = true;
					break;
				case 2:
					$scope.model.coordinatesBehavour_show = true;
					$scope.model.coordinatesBehavour_readonly = false;
					break;
			}

			$scope.model.hideLabel = $scope.model.config.hideLabel == 1;
			$scope.model.hideMap = false;

			var height = parseInt($scope.model.config.height);
			if (isNaN(height) || height < 1 || height > 9999) {
				height = 400;
			}
			$scope.model.height = { 'height': height.toString() + 'px' };

			angular.extend($scope, {
				map: {
					control: {
					},
					showMap: true,
					center: {
						latitude: $scope.model.coords.latitude,
						longitude: $scope.model.coords.longitude
					},
					zoom: $scope.model.coords.zoom,
					refresh: function () {
						$scope.map.control.refresh({
							latitude: $scope.model.coords.latitude,
							longitude: $scope.model.coords.longitude
						});
						$scope.map.control.getGMap().setZoom($scope.model.coords.zoom);
					},
					options: {
						disableDefaultUI: false,
						panControl: true,
						navigationControl: true,
						scrollwheel: false,
						scaleControl: true
					},
					draggable: true,
					events: {
						zoom_changed: function (args) {
							if (!ignoreEvents) {
								$scope.model.coords.zoom = parseInt(args.zoom);
								$scope.model.setValue();
							}
						}
					},
					marker: {
						id: 'AGM_' + $scope.model.alias + '_marker',
						latitude: $scope.model.coords.latitude,
						longitude: $scope.model.coords.longitude,
						icon: configIcon($scope.model.config),
						options: {
							visible: true,
							draggable: true
						},
						events: {
							dragend: function (marker) {
								if (!ignoreEvents) {
									$scope.model.coords.latitude = marker.getPosition().lat();
									$scope.model.coords.longitude = marker.getPosition().lng();
									$scope.model.setValue();
								}
							}
						}
					}
				}
			});
			var refreshTimer = self.setInterval(function () {
				if (typeof $scope.map.control !== 'undefined' && $scope.map.control != null && typeof $scope.map.control.getGMap !== 'undefined' && $scope.map.control.getGMap() != null) {
					self.clearInterval(refreshTimer);
					google.maps.event.addListenerOnce($scope.map.control.getGMap(), 'tilesloaded', function () {
						$scope.map.refresh();

						if ($scope.model.config.hideSearch != '1') {
							var autocomplete = new google.maps.places.Autocomplete(document.getElementById('AGM_' + $scope.model.alias + '_lookup'), {});

							google.maps.event.addListener(autocomplete, 'place_changed', function () {
								var geometry = autocomplete.getPlace().geometry;
								if (geometry) {
									$scope.map.control.getGMap().panTo(geometry.location);
									$scope.model.coords.latitude = $scope.map.marker.latitude = geometry.location.lat();
									$scope.model.coords.longitude = $scope.map.marker.longitude = geometry.location.lng();
									$scope.model.setValue();
									$scope.map.refresh();
                                }
							});
						}
					});
				}
			}, 100);
			var refreshTimer2 = self.setInterval(function () {
			    if (typeof $scope.map.control !== 'undefined' && $scope.map.control != null && typeof $scope.map.control.getGMap !== 'undefined' && $scope.map.control.getGMap() != null && typeof $element.innerHeight !== 'undefined' && $element.innerHeight() > 0) {
			        self.clearInterval(refreshTimer2);
			        $scope.map.refresh();
			    }
			}, 100);

			//$scope.$watch(function () {
			//	return $element.innerWidth() * $element.innerHeight();
			//}, function (newValue, oldValue) {
			//	if (newValue != 0 && typeof $scope.map.control.getGMap !== 'undefined') {
			//		google.maps.event.trigger($scope.map.control.getGMap(), 'resize');
			//	}
			//}, true);

		} else {
			//	Google maps hasn't loaded, so make coords editable and hide everything else
			$scope.model.config.hideSearch = true;
			$scope.model.hideMap = true;
			$scope.model.coordinatesBehavour_show = true;
			$scope.model.coordinatesBehavour_readonly = false;
		}

		$scope.checkCoordsTimer = null;
		$scope.checkCoords = function () {
			var coords = coordinates($scope.model.value);
			if (typeof coords == 'boolean') {
				$scope.model.forecolor = styleColorRed;
			} else {
				$scope.model.forecolor = {};
				if (loadingSuccessful == true) {
					if ($scope.checkCoordsTimer != null) {
						self.clearTimeout($scope.checkCoordsTimer);
					}
					$scope.checkCoordsTimer = self.setTimeout(function () {
						$scope.checkCoordsTimer = null;
						ignoreEvents = true;
						$scope.map.control.getGMap().panTo({ lat: coords.latitude, lng: coords.longitude });
						$scope.model.coords.latitude = $scope.map.marker.latitude = coords.latitude;
						$scope.model.coords.longitude = $scope.map.marker.longitude = coords.longitude;
						$scope.map.control.getGMap().setZoom(coords.zoom);
						ignoreEvents = false;
					}, 1000);
				}
			}
		}

	}
}());
