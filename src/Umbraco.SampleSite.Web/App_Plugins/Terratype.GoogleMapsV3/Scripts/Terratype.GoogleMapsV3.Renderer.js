(function (root) {

	var isGmapsReady = false;

	var q = {
		id: 'Terratype.GoogleMapsV3',
		maps: [],
		_defaultProvider: {
			predefineStyling: 'retro',
			showRoads: true,
			showLandmarks: true,
			showLabels: true,
			variety: {
				basic: true,
				satellite: false,
				terrain: false,
				selector: {
					type: 1,     // Horizontal Bar
					position: 0  // Default
				}
			},
			streetView: {
				enable: false,
				position: 0
			},
			fullscreen: {
				enable: false,
				position: 0
			},
			scale: {
				enable: false,
				position: 0
			},
			zoomControl: {
				enable: true,
				position: 0,
			},
			panControl: {
				enable: false
			},
			draggable: true
		},
		ready: function () {
			return isGmapsReady;
		},
		_loadMap: function (model, match) {
			return {
				_provider: root.terratype._mergeJson(q._defaultProvider, model.provider),
				_center: null,
				_bound: new root.google.maps.LatLngBounds(null)
			};
		},
		_loadMarker: function (m, model, match) {
			if (model.position) {
				var datum = root.terratype._parseLatLng(model.position.datum);
				var latlng = new root.google.maps.LatLng(datum.latitude, datum.longitude);
				if (m._center == null) {
					m._center = latlng;
				}
				if (model.icon && model.icon.url) {
					m.positions.push({
						id: id,
						tag: match.getAttribute('data-tag'),
						label: match.getAttribute('data-label-id'),
						position: model.position,
						_latlng: latlng,
						_icon: {
							url: root.terratype._configIconUrl(model.icon.url),
							scaledSize: new root.google.maps.Size(model.icon.size.width, model.icon.size.height),
							anchor: new root.google.maps.Point(
								root.terratype._getAnchorHorizontal(model.icon.anchor.horizontal, model.icon.size.width),
								root.terratype._getAnchorVertical(model.icon.anchor.vertical, model.icon.size.height))
						},
						autoShowLabel: match.getAttribute('data-auto-show-label') ? true : false
					});
					m._bound.extend(latlng);
				}
			}
		},
		_markerClustererUrl: function () {
			return document.getElementsByClassName(q.id)[0].getAttribute('data-markerclusterer-url')
		},
		_mapTypeIds: function (basic, satellite, terrain) {
			var mapTypeIds = [];
			if (basic) {
				mapTypeIds.push('roadmap');
			}
			if (satellite) {
				mapTypeIds.push('satellite');
			}
			if (terrain) {
				mapTypeIds.push('terrain');
			}

			if (mapTypeIds.length == 0) {
				mapTypeIds.push('roadmap');
			}
			return mapTypeIds;
		},
		_render: function (m) {
			var mapTypeIds = q._mapTypeIds(m._provider.variety.basic, m._provider.variety.satellite, m._provider.variety.terrain);
			if (m.autoFit) {
				m._center = m._bound.getCenter();
			}
			m.handle = new root.google.maps.Map(document.getElementById(m._div), {
				disableDefaultUI: false,
				scrollwheel: false,
				panControl: false,      //   Has been deprecated
				center: m._center,
				zoom: m.zoom,
				draggable: true,
				fullScreenControl: m._provider.fullscreen.enable,
				fullscreenControlOptions: m._provider.fullscreen.position,
				styles: m._provider.styles,
				mapTypeId: mapTypeIds[0],
				mapTypeControl: (mapTypeIds.length > 1),
				mapTypeControlOptions: {
					style: m._provider.variety.selector.type,
					mapTypeIds: mapTypeIds,
					position: m._provider.variety.selector.position
				},
				scaleControl: m._provider.scale.enable,
				scaleControlOptions: {
					position: m._provider.scale.position
				},
				streetViewControl: m._provider.streetView.enable,
				streetViewControlOptions: {
					position: m._provider.streetView.position
				},
				zoomControl: m._provider.zoomControl.enable,
				zoomControlOptions: {
					position: m._provider.zoomControl.position
				}
			});
			root.google.maps.event.addListener(m.handle, 'zoom_changed', function () {
				if (m._ignoreEvents > 0) {
					return;
				}
				q.closeInfoWindows(m);
				m.zoom = m.handle.getZoom();
				root.terratype._callZoom(q, m, m.zoom);
			});
			root.google.maps.event.addListenerOnce(m.handle, 'tilesloaded', function () {
				var el = document.getElementById(m._div);
				if (root.terratype._isElementInViewport(el) && el.clientHeight != 0 && el.clientWidth != 0) {
					q.refresh(m);
				}
			});
			root.google.maps.event.addListener(m.handle, 'resize', function () {
				if (m._ignoreEvents > 0) {
					return;
				}
				q._checkResize(m);
			});
			root.google.maps.event.addListener(m.handle, 'click', function () {
				if (m._ignoreEvents > 0) {
					return;
				}
				q.closeInfoWindows(m);
			});
			var markers = [];

			root.terratype._forEach(m.positions, function (p, item) {
				item.handle = new root.google.maps.Marker({
					map: m.handle,
					position: item._latlng,
					id: item.id,
					draggable: false,
					icon: item._icon
				});

				item._info = null;
				var l = (item.label) ? document.getElementById(item.label) : null;
				if (l) {
					item._info = new root.google.maps.InfoWindow({
						content: l
					});
					item.handle.addListener('click', function () {
						if (m._ignoreEvents > 0) {
							return;
						}
						q.closeInfoWindows(m);
						if (item._info != null) {
							q.openInfoWindow(m, p);
						}
					});
					if (root.terratype._domDetectionType == 2 && item.autoShowLabel) {
						root.setTimeout(function () {
							q.openInfoWindow(m, m.positions[p]);
						}, 100);
					}
				} else {
					item.handle.addListener('click', function () {
						root.terratype._callClick(q, m, item);
					});
				}
				markers.push(item.handle);
			});

			if (m.positions.length > 1) {
				m._markerclusterer = new MarkerClusterer(m.handle, markers, { imagePath: q._markerClustererUrl() });
			}
		},
		openInfoWindow: function (m, p) {
			var item = m.positions[p];
			item._info.open(m.handle, item.handle);
			root.terratype._callClick(q, m, item);
		},
		closeInfoWindows: function (m) {
			root.terratype._forEach(m.positions, function (p, item) {
				if (item._info != null) {
					item._info.close();
				}
			});
		},
		_checkResize: function (m) {
			if (!m.handle.getBounds().contains(m._center)) {
				q.refresh(m);
			}
		},
		_resetCenter: function (m) {
			if (m.autoFit) {
				m.handle.setZoom(20);
				var bound = new root.google.maps.LatLngBounds(m._bound.getSouthWest(), m._bound.getNorthEast());
				m.handle.fitBounds(bound);
			}
			m.zoom = m.handle.getZoom();
			m.handle.setCenter(m._center);
		},
		_checkResetCenter: function (m) {
			if (m._refreshes == 0) {
				root.terratype._forEach(m.positions, function (p, item) {
					if (item.autoShowLabel) {
						root.setTimeout(function () {
							q.openInfoWindow(m, p);
						}, 100);
					}
				});
				m._status = 2;
			}
			if (m._refreshes == 0 || m.recenterAfterRefresh) {
				q._resetCenter(m);
			}
			if (m._refreshes++ == 0) {
				root.terratype._opacityShow(m);
				root.terratype._callRender(q, m);
			} else {
				root.terratype._callRefresh(q, m);
			}
		},
		refresh: function (m) {
			if (m._ignoreEvents == 0) {
				m._ignoreEvents++;
				root.google.maps.event.addListenerOnce(m.handle, 'tilesloaded', function () {
					if (m._idle == null) {
						return;
					}
					m._ignoreEvents--;
					if (m._ignoreEvents == 0) {
						q._checkResetCenter(m);
					}
					if (m._idle) {
						root.clearTimeout(m._idle);
					}
				});
				m._idle = root.setTimeout(function () {
					if (m._ignoreEvents != 0) {
						q._checkResetCenter(m);
						m._ignoreEvents = 0
					}
					root.clearTimeout(m._idle);
					m._idle = null;
				}, 5000);
				root.google.maps.event.trigger(m.handle, 'resize');
			}
		}
	};

	if (root.terratype && root.terratype._addProvider) {
		root.terratype._addProvider(q.id, q);
	} else {
		var timer = root.setInterval(function () {
			if (root.terratype && root.terratype._addProvider) {
				root.terratype._addProvider(q.id, q);
				root.clearInterval(timer);
			}
		}, 100);
	}

	root.TerratypeGoogleMapsV3CallbackRender = function () {
		isGmapsReady = true;
	}
}(window));


