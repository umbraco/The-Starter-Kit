(function (root) {
	if (!root.terratype) {
		root.terratype = {
			_poll: 100,
			_killSwitch: 1200,
			providers: {},
			_addProvider: function (id, obj) {
				if (root.terratype.providers[id]) {
					root.terratype.providers[id] = root.terratype._mergeJson(root.terratype.providers[id], obj);
				} else {
					root.terratype.providers[id] = obj;
				}
				root.terratype.providers[id]._status = 0;
				root.terratype.providers[id]._domDetectionType = 99;
			},
			coordinateSystems: {},
			_addCoordinateSystem: function (id, obj) {
				if (root.terratype.coordinateSystems[id]) {
					root.terratype.coordinateSystems[id] = root.terratype._mergeJson(root.terratype.coordinateSystems[id], obj);
				} else {
					root.terratype.coordinateSystems[id] = obj;
				}
			},
			_events: [[],[],[],[],[],[]],
			_addEvent: function (i, f) {
				root.terratype._events[i].push(f);
			},
			_callEvent: function (i, a, b, c) {
				root.terratype._forEach(root.terratype._events[i], function (index, func) {
					(function (f, a, b, c){ f(a, b, c); })(func, a, b, c);
				});
			},
			onInit: function (f) {
				root.terratype._addEvent(0, f);
			},
			_callInit: function (provider) {
				root.terratype._callEvent(0, provider);
			},
			onLoad: function (f) {
				root.terratype._events[1].push(f);
			},
			_callLoad: function (provider, map) {
				root.terratype._callEvent(1, provider, map);
			},
			onRender: function (f) {
				root.terratype._events[2].push(f);
			},
			_callRender: function (provider, map) {
				root.terratype._callEvent(2, provider, map);
			},
			onRefresh: function (f) {
				root.terratype._events[3].push(f);
			},
			_callRefresh: function (provider, map) {
				root.terratype._callEvent(3, provider, map);
			},
			onClick: function (f) {
				root.terratype._events[4].push(f);
			},
			_callClick: function (provider, map, marker) {
				root.terratype._callEvent(4, provider, map, marker);
			},
			onZoom: function (f) {
				root.terratype._events[5].push(f);
			},
			_callZoom: function (provider, map, zoomLevel) {
				root.terratype._callEvent(5, provider, map, zoomLevel);
			},
			_forEach: function (obj, func) {
				for (var i = 0; i != obj.length; i++) {
					(function (f, i, o) { f(i, o); })(func, i, obj[i]);
				}
			},
			_mergeJson: function (aa, bb) {        //  Does not merge arrays
				var mi = function (c) {
					var t = {};
					for (var k in c) {
						if (c[k] && typeof c[k] === 'object' && c[k].constructor.name !== 'Array') {
							t[k] = mi(c[k]);
						} else {
							t[k] = c[k];
						}
					}
					return t;
				}
				var mo = function (a, b) {
					var r = (a) ? mi(a) : {};
					if (b) {
						for (var k in b) {
							if (r[k] && typeof r[k] === 'object' && r[k].constructor.name !== 'Array') {
								r[k] = mo(r[k], b[k]);
							} else {
								r[k] = b[k];
							}
						}
					}
					return r;
				}
				return mo(aa, bb);
			},
			_configIconUrl: function (url) {
				if (typeof (url) === 'undefined' || url == null) {
					return '';
				}
				if (url.indexOf('//') != -1) {
					//  Is an absolute address
					return url;
				}
				//  Must be a relative address
				if (url.substring(0, 1) != '/') {
					url = '/' + url;
				}

				return root.location.protocol + '//' + root.location.hostname + (root.location.port ? ':' + root.location.port : '') + url;
			},
			_getAnchorHorizontal: function (text, width) {
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
			},
			_getAnchorVertical: function (text, height) {
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
			},
			_parseLatLng: function (text) {
				var args = text.trim().split(',');
				if (args.length < 2) {
					return false;
				}
				var lat = parseFloat(args[0].substring(0, 10));
				if (isNaN(lat) || lat > 90 || lat < -90) {
					return false;
				}
				var lng = parseFloat(args[1].substring(0, 10));
				if (isNaN(lng) || lng > 180 || lng < -180) {
					return false;
				}
				return {
					latitude: lat,
					longitude: lng
				};
			},
			_isElementInViewport: function (el) {
				var rect = el.getBoundingClientRect();
				return (
					(rect.top <= (window.innerHeight || document.documentElement.clientHeight)) && ((rect.top + rect.height) >= 0) &&
					(rect.left <= (window.innerWidth || document.documentElement.clientWidth)) && ((rect.left + rect.width) >= 0)
				);
			},
			_opacityShow: function (m) {
				var el = document.getElementById(m._div);
				el.style.opacity = '1.0';
				el.style.filter = 'alpha(opacity=100)';
			},
			_idleJs: function (provider, map) {
				//  Monitor dom changes via Javascript
				var el = document.getElementById(map._div);
				var newValue = el.parentElement.offsetTop + el.parentElement.offsetWidth;
				var newSize = el.clientHeight * el.clientWidth;
				var show = !(el.style.display && typeof el.style.display == 'string' && el.style.display.toLowerCase() == 'none');
				var visible = show && root.terratype._isElementInViewport(el);
				if (newValue != 0 && show == false) {
					//console.log('A ' + m.id + ': in viewport = ' + visible + ', showing = ' + show);
					//  Was hidden, now being shown
					el.style.display = 'block';
				} else if (newValue == 0 && show == true) {
					//console.log('B ' + m.id + ': in viewport = ' + visible + ', showing = ' + show);
					//  Was shown, now being hidden
					el.style.display = 'none';
					map.visible = false;
				}
				else if (visible == true && map._divoldsize != 0 && newSize != 0 && map._divoldsize != newSize) {
					//console.log('C ' + m.id + ': in viewport = ' + visible + ', showing = ' + show);
					//  showing, just been resized and map is visible
					(function (p, m) { provider.refresh.call(p, m); })(provider, map);
					map.visible = true;
				} else if (visible == true && map.visible == false) {
					//console.log('D ' + m.id + ': in viewport = ' + visible + ', showing = ' + show);
					//  showing and map just turned visible
					(function (p, m) { provider.refresh.call(p, m); })(provider, map);
					map.visible = true;
				} else if (visible == false && map.visible == true) {
					//console.log('E ' + m.id + ': in viewport = ' + visible + ', showing = ' + show);
					//  was visible, but now hiding
					map.visible = false;
				}
				map._divoldsize = newSize;
			},
			_idleJquery: function (provider, map) {
				//  Monitor dom changes via jQuery
				var r = false;
				var el = jQuery(document.getElementById(map.div));
				var show = !(el.is(':hidden'));
				var visible = el.is(':visible');
				if (show == visible) {
					if (show) {
						var newSize = el.height() * el.width();
						if (newSize != map._divoldsize) {
							(function (p, m) { provider.refresh.call(p, m); })(provider, map);
						}
						map._divoldsize = newSize;
					}
					return;
				}
				if (show) {
					el.hide();
					map._divoldsize = 0;
					(function (p, m) { provider.refresh.call(p, m); })(provider, map);
					return;
				}
				el.show();
				(function (p, m) { provider.refresh.call(p, m); })(provider, map);
				map._divoldsize = el.height() * el.width();
			},
			_loadCss: function (css) {
				for (var c = 0; c != css.length; c++) {
					if (document.createStyleSheet) {
						document.createStyleSheet(css[c]);
					} else {
						var l = document.createElement('link');
						l.rel = 'stylesheet';
						l.type = 'text/css';
						l.href = css[c];
						l.media = 'screen';
						document.getElementsByTagName('head')[0].appendChild(l);
					}
				}
			},
			_getMap: function (maps, mapId) {
				for (var i = 0; i != maps.length; i++) {
					if (maps[i].id == mapId) {
						return maps[i];
					}
				}
				return null;
			},
			_jQueryMonitoring: false,
			_jQueryMonitorTimer: null,
			_jQueryMonitor: function () {
				var providerCounter = 0;
				var mapCounter = 0;
				var providers = [];
				for (var provider in root.terratype.providers) {
					providers.push(provider.id);
				}
				if (root.terratype._jQueryMonitorTimer != null) {
					root.clearInterval(root.terratype._jQueryMonitorTimer);
				}
				root.terratype._jQueryMonitorTimer = root.setInterval(function () {
					if (providerCounter == providers.length) {
						root.clearInterval(root.terratype._jQueryMonitorTimer);
					} else {
						var provider = root.terratype.providers[providers[providerCounter]];
						if (mapCounter == provider.maps.length) {
							providerCounter++;
							mapCounter = 0;
						} else {
							root.terratype._idleJquery(provider, provider.maps[mapCounter++]);
						}
					}
				}, root.terratype._poll);
			},
			_initTimer: null,
			init: function () {
				var kill = 0;
				var providers = null;
				var providerCounter = 0;
				var activeCounter = 0;
				var mapCounter = 0;
				var mapRunning = 0;
				if (root.terratype._initTimer != null) {
					root.clearInterval(root.terratype._initTimer);
					for (var provider in root.terratype.providers) {
						provider._status = 0;
						provider.maps = [];
						//TODO: Need a way to remove existing maps
					}
				}
				root.terratype._initTimer = root.setInterval(function () {
					kill++;
					if (providers == null) {
						providers = [];
						for (var provider in root.terratype.providers) {
							providers.push(provider);
						}
						activeCounter = 0;
						providerCounter = 0;
						mapCounter = 0;
						mapRunning = 0;
					} else if (providerCounter == providers.length) {
						providers = null;
						if (activeCounter == 0 && kill > root.terratype._killSwitch) {
							root.clearInterval(root.terratype._initTimer);
						}	
					} else {
						var provider = root.terratype.providers[providers[providerCounter]];

						if (provider._status == 3 && mapCounter < provider.maps.length) {
							var m = provider.maps[mapCounter++];
							switch (m._status) {
								case 0:		//	Needs rendering
									(function (p, m) { provider._render.call(p, m); })(provider, m);
									m._status = 1;
									activeCounter++;
									mapRunning++;
									break;

								case 1:		//	Needs monitoring
									if (root.jQuery && provider._domDetectionType == 1) {
										if (root.terratype._jQueryMonitoring == false) {
											root.jQuery(window).on('DOMContentLoaded load resize scroll touchend', root.terratype._jQueryMonitor);
											root.terratype._jQueryMonitoring = true;
										}
									} else if (provider._domDetectionType != 2) {
										activeCounter++;
										root.terratype._idleJs(provider, m);
									}
									mapRunning++;
									break;
							}
						} else {
							switch (provider._status) {
								case -1:	//	This provider currently has no maps to render
									break;

								case 0:		//	Waiting for support javascript libraries to load
									activeCounter++;
									if (provider.ready()) {
										provider._status = 1;
										root.terratype._callInit(provider);
									}
									break;

								case 1:		//	Load maps
									activeCounter++;
									var matches = document.getElementsByClassName(provider.id);
									if (matches.length == 0) {
										provider._status = -1;
									} else {
										root.terratype._forEach(matches, function (i, match) {
											var domDetectionType = parseInt(match.getAttribute('data-dom-detection-type'));
											if (provider._domDetectionType > domDetectionType) {
												provider._domDetectionType = domDetectionType;
											}
											mapId = match.getAttribute('data-map-id');
											id = match.getAttribute('data-id');
											var model = JSON.parse(unescape(match.getAttribute('data-model')));
											var m = root.terratype._getMap(provider.maps, mapId);
											if (m == null) {
												match.style.display = 'block';
												var loadMap = {};
												if (provider._loadMap) {
													(function (p, model, match) { loadMap = provider._loadMap.call(p, model, match); })(provider, model, match);
												}
												m = root.terratype._mergeJson(loadMap, {
													zoom: model.zoom,
													_ignoreEvents: 0,
													_refreshes: 0,
													id: mapId,
													_div: id,
													_divoldsize: 0,
													_status: 0,
													visible: false,
													autoFit: match.getAttribute('data-auto-fit') ? true : false,
													recenterAfterRefresh: match.getAttribute('data-recenter-after-refresh') ? true : false,
													handle: null,
													positions: [],
													getPosition: function (tag) {
														for (var i = 0; i != m._positions.length; i++) {
															if (m._positions[i].tag == tag) {
																return m._positions[i];
															}
														}
														return null;
													},
													isVisible: function () {
														var el = document.getElementById(m._div);
														var newValue = el.parentElement.offsetTop + el.parentElement.offsetWidth;
														var newSize = el.clientHeight * el.clientWidth;
														var show = !(el.style.display && typeof el.style.display == 'string' && el.style.display.toLowerCase() == 'none');
														var visible = show && root.terratype._isElementInViewport(document.getElementById(m._div));
														return visible && newValue > 0 && newSize > 0;
													},
													refresh: function () {
														(function (p, m) { provider.refresh.call(p, m); })(provider, m);
													}
												});
												provider.maps.push(m);
											}
											if (provider._loadMarker) {
												(function (p, m, model, match) { provider._loadMarker.call(p, m, model, match); })(provider, m, model, match);
											}
										});
										root.terratype._forEach(provider.maps, function (i, m) {
											root.terratype._callLoad(provider, m);
										});
										provider._status = 2;
									}
									break;

								case 2:		//	Has loaded
									activeCounter++;
									var cont = true;
									if (provider._prerender) {
										(function (p) { cont = provider._prerender.call(p); })(provider);
									}
									if (cont) {
										provider._status = 3;
									}
									break;

								case 3:		//	Monitoring
									activeCounter++;
									if (mapRunning == 0) {
										provider._status = -1;
									}
									break;
							}
							providerCounter++;
							mapCounter = 0;
							mapRunning = 0;
						}

					}
				}, root.terratype._poll);
			},
		};

		root.terratype.init();
	}
}(window));
