(function (root) {
    var identifier = 'Terratype.LeafletV1';

    Number.isInteger = Number.isInteger || function (value) {
        return typeof value === "number" &&
               isFinite(value) &&
               Math.floor(value) === value;
    };

    var event = {
        events: [],
        register: function (id, name, scope, object, func) {
            //sub.originalConsole.log("Register " + name + ":" + id);

            event.events.push({
                id: id,
                name: name,
                func: func,
                scope: scope,
                object: object
            });
        },
        cancel: function (id) {
            var newEvents = [];
            angular.forEach(event.events, function (e, i) {
                if (e.id != id) {
                    newEvents.push(e);
                } else {
                    //sub.originalConsole.log("Cancel " + e.name + ":" + e.id);
                }
            });
            event.events = newEvents;
        },
        broadcast: function (name) {
            var log = 'Broadcast ' + name + ' ';
            angular.forEach(event.events, function (e, i) {
                if (e.name == name) {
                    log += e.id + ',';
                    e.func.call(e.scope, e.object);
                }
            });
            //sub.originalConsole.log(log);
        },
        broadcastSingle: function (name, counter) {
            var loop = 0;
            while (loop != 2 && event.events.length != 0) {
                if (counter >= event.events.length) {
                    counter = 0;
                    loop++;
                }

                var e = event.events[counter++];
                if (e.name == name) {
                    e.func.call(e.scope, e.object);
                    return counter;
                }
            }
            return null;
        },
        present: function (id) {
            if (id) {
                var count = 0;
                angular.forEach(event.events, function (e, i) {
                    if (e.id != id) {
                        count++;
                    }
                });
                return count;
            }
            return event.events.length;
        }
    }

    //  Subsystem that loads or destroys Leaflet maps
    var sub = {
        poll: 250,
        destroySubsystem: function () {
            if (sub.running) {
                clearInterval(sub.running);
                sub.running = null;
            }
        },
        ticks: function () {
            return (new Date().getTime());
        },
        running: null,
        single: null,
        createSubsystem: function () {
            if (sub.running != null) {
                return;
            }
            sub.running = setInterval(function () {
                sub.single = event.broadcastSingle('gmaprefresh', sub.single);
                if (sub.single == null) {
                    sub.destroySubsystem();
                }
            }, sub.poll);
        },
        configIconUrl: function (url) {
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
        getAnchorHorizontal: function (text, width) {
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
        getAnchorVertical: function (text, height) {
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
        icon: function (icon) {
            if (icon.url && icon.size.width && icon.size.height) {
                return L.icon({
                    iconUrl: sub.configIconUrl(icon.url),
                    iconSize: [icon.size.width, icon.size.height],
                    iconAnchor: [sub.getAnchorHorizontal(icon.anchor.horizontal, icon.size.width),
                        sub.getAnchorVertical(icon.anchor.vertical, icon.size.height)]
                });
            } else {
                return L.icon({
                    iconUrl: 'https://mt.google.com/vt/icon/name=icons/spotlight/spotlight-poi.png',
                    iconSize: [22,40],
                    iconAnchor: [11,39]
                });
            }
        },
        mergeJson: function (aa, bb) {        //  Does not merge arrays
            var mi = function (c) {
                var t = {};
                for (var k in c) {
                    if (typeof c[k] === 'object' && c[k].constructor.name !== 'Array') {
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
        round: function (num, decimals) {
            var sign = num >= 0 ? 1 : -1;
            var pow = Math.pow(10, decimals);
            return parseFloat((Math.round((num * pow) + (sign * 0.001)) / pow).toFixed(decimals));
        },
        controlPosition: function (i) {
            switch (parseInt(i)) {
                case 1:
                    return 'topleft';
                case 3:
                    return 'topright';
                case 10:
                    return 'bottomleft';
                case 12:
                    return 'bottomright';
            }
            return 'topleft';
        }
    }

    var provider = {
        identifier: identifier,
        datumWait: 330,
        translate: true,
        mapSources: [],
        css: ['css/leaflet.css'],
        js: ['scripts/leaflet.js', 'scripts/tileservers.js'],
        boot: function (id, urlProvider, store, config, vm, updateView, translate, done) {
            var scope = {
                events: [],
                datumChangeWait: null,
                defaultConfig: {
                    position: {
                        datum: "55.4063207,10.3870147"
                    },
                    zoom: 12,
                    provider: {
                        id: identifier,
                        layers: [{
                            maxZoom: 18,
                            id: 'OpenStreetMap.Mapnik'
                        }],
                        zoomControl: {
                            enable: true,
                            position: 1
                        }
                    }
                },
                initValues: function () {
                    if (!store().position.datum) {
                        store().position.datum = scope.defaultConfig.position.datum;
                    }
                    vm().position.datum = scope.parse.call(scope, store().position.datum);

                    if (!store().zoom) {
                        store().zoom = scope.defaultConfig.zoom;
                    }
                    config().provider = sub.mergeJson(scope.defaultConfig.provider, config().provider);
                    config().search = sub.mergeJson(scope.defaultConfig.search, config().search);
                },
                mapSourceByCoordinateSystem: {},
                mapSourceById: {},
                tileServerByCoordinateSystemAndMapSource: {},
                tileServerById: {},
                tileServerByCoordinateSystemAndId: {},
                init: function (done) {
                    //event.cancel(id);
                    scope.mapSourceByCoordinateSystem = {};
                    scope.mapSourceById = {};
                    scope.tileServerByCoordinateSystemAndMapSource = {};
                    scope.tileServerById = {};
                    scope.tileServerByCoordinateSystemAndId = {};
                    var t = root.terratype.leaflet.translate;
                    root.terratype.leaflet.translate = true;
                    var tc = 0;
                    //  Calculate all language values
                    for (var t1 = 0; t1 != root.terratype.leaflet.tileServers.length; t1++) {
                        var ms = root.terratype.leaflet.tileServers[t1];
                        scope.mapSourceById[ms.id] = ms;
                        if (!t) {
                            (function (ms) {
                                tc += 2;
                                translate(ms.name, function (value) {
                                    ms.name = value;
                                    if (--tc == 0) {
                                        d();
                                    }
                                });
                                translate(ms.description, function (value) {
                                    ms.description = value;
                                    if (--tc == 0) {
                                        d();
                                    }
                                });
                                if (ms.key.enable) {
                                    tc += 4;
                                    translate(ms.key.name, function (value) {
                                        ms.key.name = value;
                                        if (--tc == 0) {
                                            d();
                                        }
                                    });
                                    translate(ms.key.description, function (value) {
                                        ms.key.description = value;
                                        if (--tc == 0) {
                                            d();
                                        }
                                    });
                                    translate(ms.key.placeholder, function (value) {
                                        ms.key.placeholder = value;
                                        if (--tc == 0) {
                                            d();
                                        }
                                    });
                                    translate(ms.key.url, function (value) {
                                        ms.key.url = value;
                                        if (--tc == 0) {
                                            d();
                                        }
                                    });
                                }
                            }(ms));
                        }
                        var added = {};
                        for (var t2 = 0; t2 != ms.tileServers.length; t2++) {
                            var v = ms.tileServers[t2];
                            scope.tileServerById[v.id] = v;
                            if (!t) {
                                (function (v) {
                                    tc += 2;
                                    translate(v.name, function (value) {
                                        v.name = value;
                                        if (--tc == 0) {
                                            d();
                                        }
                                    });
                                    translate(v.attribution, function (value) {
                                        v.attribution = value;
                                        if (--tc == 0) {
                                            d();
                                        }
                                    });
                                }(v));
                            }
                            for (t3 = 0; t3 != v.coordinateSystems.length; t3++) {
                                var c = v.coordinateSystems[t3];
                                if (!scope.tileServerByCoordinateSystemAndMapSource[c]) {
                                    scope.tileServerByCoordinateSystemAndMapSource[c] = {};
                                }
                                if (!scope.tileServerByCoordinateSystemAndMapSource[c][ms.id]) {
                                    scope.tileServerByCoordinateSystemAndMapSource[c][ms.id] = [];
                                }
                                scope.tileServerByCoordinateSystemAndMapSource[c][ms.id].push(v);
                                scope.tileServerByCoordinateSystemAndId[c + '.' + v.id] = true;
                                if (!added[ms.id]) {
                                    if (!scope.mapSourceByCoordinateSystem[c]) {
                                        scope.mapSourceByCoordinateSystem[c] = [];
                                    }
                                    scope.mapSourceByCoordinateSystem[c].push(ms);
                                    added[ms.id] = true;
                                }
                            }
                        }
                    }
                    if (store().position) {
                        if (typeof store().position.datum === 'string') {
                            vm().position.datum = scope.parse.call(scope, store().position.datum);
                        }
                    }
                    if (config().provider && config().provider.mapSources && config().provider.mapSources.length != 0) {
                        for (var i = 0; i != config().provider.mapSources.length; i++) {
                            provider.mapSources.push({
                                show: false,
                                minZoom: config().provider.mapSources[i].minZoom,
                                maxZoom: config().provider.mapSources[i].maxZoom,
                                testImage: config().provider.mapSources[i].minZoom,
                                testImageRange: config().provider.mapSources[i].minZoom
                            });
                        }
                    }
                    if (tc == 0) {
                        d();
                    }
                    updateView();
                    function d() {
                        if (vm().isPreview == false && config().provider && config().provider.mapSources && config().provider.mapSources.length != 0 &&
                            scope.mapSourceValid() && store().position && store().position.id && vm().position.precision) {
                            scope.loadMap.call(scope);
                        }
                        done({
                            httpCalls: {
                            },
                            files: {
                                logo: urlProvider(identifier, 'images/Logo.png'),
                                mapExample: urlProvider(identifier, 'images/Example.png'),
                                views: {
                                    config: {
                                        definition: urlProvider(identifier, 'views/config.definition.html', true),
                                        appearance: urlProvider(identifier, 'views/config.appearance.html', true),
                                        search: urlProvider(identifier, 'views/config.search.html', true)
                                    },
                                    editor: {
                                        appearance: urlProvider(identifier, 'views/editor.appearance.html', true)
                                    },
                                    grid: {
                                        appearance: urlProvider(identifier, 'views/grid.appearance.html', true)
                                    }
                                }
                            },
                            setProvider: function () {
                                if (vm().provider.id != identifier) {
                                    event.cancel(id);
                                }
                            },
                            setCoordinateSystem: function () {
                                if (store().position && scope.mapSourceValid()) {
                                    scope.reloadMap.call(scope);
                                }
                            },
                            setIcon: function () {
                                if (scope.gmarker) {
                                    scope.gmarker.setIcon(sub.icon.call(sub, config().icon));
                                }
                            },
                            styleChange: function () {
                            },
                            datumChange: function (text) {
                                vm().datumChangeText = text;
                                if (scope.datumChangeWait) {
                                    clearTimeout(scope.datumChangeWait);
                                }
                                scope.datumChangeWait = setTimeout(function () {
                                    scope.datumChangeWait = null;
                                    var p = scope.parse.call(scope, vm().datumChangeText);
                                    if (typeof p !== 'boolean') {
                                        vm().position.datum = p;
                                        scope.setDatum.call(scope);
                                        scope.setMarker.call(scope);
                                        return;
                                    }
                                    vm().position.datumStyle = { 'color': 'red' };
                                }, provider.datumWait);
                            },
                            optionChange: function () {
                                if (scope.gmap) {
                                    if (scope.zoomControl) {
                                        scope.gmap.removeControl(scope.zoomControl);
                                    }
                                    if (config().provider.zoomControl.enable) {
                                        scope.zoomControl = L.control.zoom({
                                            position: sub.controlPosition(config().provider.zoomControl.position)
                                        }).addTo(scope.gmap);
                                    }
                                }
                            },
                            reload: function () {
                                scope.mapSourceOrderRows();
                                scope.reloadMap.call(scope);
                            },
                            addEvent: function (id, func, s) {
                                scope.events.push({ id: id, func: func, scope: s });
                            },
                            labelChange: function () {
                                if (scope.gmap && scope.gmarker) {
                                    if (scope.ginfo) {
                                        scope.gmap.closePopup();
                                        scope.gmarker.unbindPopup();
                                    }
                                    if (store().label && typeof store().label.content == 'string' && store().label.content.trim() != '') {
                                        scope.ginfo = scope.gmarker.bindPopup(store().label.content);
                                    }
                                }
                            },
                            destroy: scope.destroy,
                            mapSourceAddRow: function () {
                                if (!config().provider) {
                                    config().provider = {};
                                }
                                if (!config().provider.mapSources) {
                                    config().provider.mapSources = [];
                                }
                                config().provider.mapSources.push({
                                    minZoom: 0,
                                    maxZoom: 24
                                });
                                if (!vm().provider.mapSources) {
                                    vm().provider.mapSources = [];
                                }
                                vm().provider.mapSources.push({
                                    show: false
                                });
                            },
                            mapSourceToggleRow: function (index, show) {
                                for (var i = 0; i != config().provider.mapSources.length; i++) {
                                    if (i != index) {
                                        vm().provider.mapSources[i].show = false;
                                    } else {
                                        if (typeof show === 'undefined') {
                                            show = !(vm().provider.mapSources[index].show);
                                        }
                                        vm().provider.mapSources[index].show = show;

                                        if (show) {
                                            setTimeout(function () {
                                                var el = document.getElementById('terratype_' + id + '_leafletv1_mapSources_' + index);
                                                if (!scope.isElementInViewport(el)) {
                                                    el.parentElement.scrollIntoView(true);
                                                }
                                            });
                                        }
                                    }
                                }
                            },
                            mapSourceDeleteRow: function (index) {
                                config().provider.mapSources.splice(index, 1);
                                vm().provider.mapSources.splice(index, 1);
                            },
                            mapSourceOrderRows: function () {
                                scope.mapSourceOrderRows();
                            },
                            mapSourceTitle: function (l) {
                                return l.minZoom + '-' + l.maxZoom + ' ' + l.mapSource + '.' + l.tileServer;
                            },
                            mapSourceValid: function (l) {
                                return scope.mapSourceValid(l);
                            },
                            mapSourceMinZoomBindIE: function (div, index) {
                                //  IE doesn't bind to model correctly, so this is here to do the binding ourselves
                                var el = document.getElementById(div);
                                if (el != null) {
                                    var n = parseInt(el.value);
                                    if (config().provider.mapSources[index].minZoom != n) {
                                        config().provider.mapSources[index].minZoom = n;
                                    }
                                }
                            },
                            mapSourceMinZoomBind: function (t, index) {
                                var n = (t == null) ? config().provider.mapSources[index].minZoom : parseInt(t);
                                var ts = scope.tileServerById[config().provider.mapSources[index].tileServer.id];
                                if (n < ts.minZoom) {
                                    n = ts.minZoom;
                                }
                                if (n > ts.maxZoom) {
                                    n = ts.maxZoom;
                                }
                                vm().provider.mapSources[index].minZoom = config().provider.mapSources[index].minZoom = n;
                                scope.mapSourceTestImageBind(null, index);
                            },
                            mapSourceMaxZoomBindIE: function (div, index) {
                                //  IE doesn't bind to model correctly, so this is here to do the binding ourselves
                                var el = document.getElementById(div);
                                if (el != null) {
                                    var n = parseInt(el.value);
                                    if (config().provider.mapSources[index].maxZoom != n) {
                                        config().provider.mapSources[index].maxZoom = n;
                                    }
                                }
                            },
                            mapSourceMaxZoomBind: function (t, index) {
                                var n = (t == null) ? config().provider.mapSources[index].maxZoom : parseInt(t);
                                var ts = scope.tileServerById[config().provider.mapSources[index].tileServer.id];
                                if (n < ts.minZoom) {
                                    n = ts.minZoom;
                                }
                                if (n > ts.maxZoom) {
                                    n = ts.maxZoom;
                                }
                                vm().provider.mapSources[index].maxZoom = config().provider.mapSources[index].maxZoom = n;
                                scope.mapSourceTestImageBind(null, index);
                            },
                            mapSourceTestImageBindIE: function (div, index) {
                                //  IE doesn't bind to model correctly, so this is here to do the binding ourselves
                                var el = document.getElementById(div);
                                if (el != null) {
                                    var n = parseInt(el.value);
                                    if (vm().provider.mapSources[index].testImage != n) {
                                        vm().provider.mapSources[index].testImage = n;
                                    }
                                }
                            },
                            mapSourceTestImageBind: function (t, index) {
                                scope.mapSourceTestImageBind(t, index);
                            },
                            mapSourceImageTest: function (index) {
                                var ms = scope.mapSourceById[config().provider.mapSources[index].mapSource.id];
                                var ts = scope.tileServerById[config().provider.mapSources[index].tileServer.id];
                                var x, y;
                                z = vm().provider.mapSources[index].testImage;
                                if (typeof z === 'undefined' || !Number.isInteger(z)) {
                                    return null;
                                }
                                switch (z) {
                                    case 0:
                                        x = y = 0;
                                        break;
                                    case 1:
                                        x = 1, y = 0;
                                        break;
                                    case 2:
                                        x = 2, y = 1;
                                        break;
                                    case 3:
                                        x = 4, y = 2;
                                        break;
                                    case 4:
                                        x = 8, y = 5;
                                        break;
                                    case 5:
                                        x = 16, y = 10;
                                        break;
                                    case 6:
                                        x = 31, y = 21;
                                        break;
                                    case 7:
                                        x = 65, y = 42;
                                        break;
                                    case 8:
                                        x = 123, y = 82
                                        break;
                                    case 9:
                                        x = 245, y = 165;
                                        break;
                                    case 10:
                                        x = 539, y = 320;
                                        break;
                                    case 11:
                                        x = 1095, y = 640;
                                        break;
                                    case 12:
                                        x = 2000, y = 1280;
                                        break;
                                    case 13:
                                        x = 4034, y = 2737;
                                        break;
                                    case 14:
                                        x = 8415, y = 5384;
                                        break;
                                    case 15:
                                        x = 9643, y = 12320;
                                        break;
                                    case 16:
                                        x = 19294, y = 24640;
                                        break;
                                    case 17:
                                        x = 120585, y = 78655;
                                        break;
                                    case 18:
                                        x = 138634, y = 82398;
                                        break;
                                    case 19:
                                        x = 262034, y = 174339;
                                        break;
                                    case 20:
                                        x = 261957 * 2, y = 174337 * 2;
                                        break;
                                    case 21:
                                        x = 261957 * 4, y = 174337 * 4;
                                        break;
                                    case 22:
                                        x = 261957 * 16, y = 174337 * 16;
                                        break;
                                    case 23:
                                        x = 261957 * 256, y = 174337 * 256;
                                        break;
                                    case 24:
                                        x = 261957 * 65536, y = 174337 * 65536;
                                        break;
                                }
                                var url = ts.url;

                                url = url.replace(new RegExp('\{x\}', 'gi'), x);
                                url = url.replace(new RegExp('\{y\}', 'gi'), y);
                                url = url.replace(new RegExp('\{z\}', 'gi'), z);
                                if (ts.options.subdomains) {
                                    url = url.replace(new RegExp('\{s\}', 'gi'), ts.options.subdomains[0]);
                                }
                                if (ms.key && ms.key.enable == true) {
                                    url = url.replace(new RegExp('\{key\}', 'gi'), config().provider.mapSources[index].key);
                                }
                                return url;
                            },
                            mapSourceByCoordinateSystem: scope.mapSourceByCoordinateSystem,
                            mapSourceById: scope.mapSourceById,
                            tileServerByCoordinateSystemAndMapSource: scope.tileServerByCoordinateSystemAndMapSource,
                            tileServerById: scope.tileServerById,
                            tileServerByCoordinateSystemAndId: scope.tileServerByCoordinateSystemAndId
                        });
                    }
                },
                mapSourceValidItem: function (l) {
                    return typeof l.mapSource !== 'undefined' && typeof l.mapSource.id !== 'undefined' && typeof l.tileServer !== 'undefined' &&
                        typeof l.tileServer.id !== 'undefined' && Number.isInteger(l.minZoom) && Number.isInteger(l.maxZoom) &&
                        (scope.tileServerByCoordinateSystemAndId[store().position.id + '.' + l.tileServer.id] == true) &&
                        (scope.mapSourceById[l.mapSource.id].key.enable == false || l.key != '') && 
                        (l.minZoom >= scope.tileServerById[l.tileServer.id].minZoom) && (l.minZoom <= l.maxZoom) && (l.maxZoom <= scope.tileServerById[l.tileServer.id].maxZoom);
                },
                mapSourceOrderRows: function () {
                    if (!config().provider || !config().provider.mapSources || config().provider.mapSources.length < 2) {
                        return;
                    }
                    var order = [];
                    var order2 = [];
                    while (config().provider.mapSources.length != 0) {
                        var ii = 0;
                        for (var j = 1; j < config().provider.mapSources.length; j++) {
                            if (config().provider.mapSources[j].minZoom < config().provider.mapSources[ii].minZoom) {
                                ii = j;
                            }
                        }
                        order.push({
                            mapSource: {
                                id: config().provider.mapSources[ii].mapSource.id
                            },
                            tileServer: {
                                id: config().provider.mapSources[ii].tileServer.id
                            },
                            minZoom: config().provider.mapSources[ii].minZoom,
                            maxZoom: config().provider.mapSources[ii].maxZoom
                        });
                        order2.push({
                            testImageRange: vm().provider.mapSources[ii].testImageRange,
                            testImage: vm().provider.mapSources[ii].testImage
                        })
                        config().provider.mapSources.splice(ii, 1);
                        vm().provider.mapSources.splice(ii, 1);
                    }
                    config().provider.mapSources = order;
                    vm().provider.mapSources = order2;
                },
                mapSourceTestImageBind: function (t, index) {
                    var ms = config().provider.mapSources[index];
                    var vs = vm().provider.mapSources[index];
                    var n = (t == null) ? vs.testImage : parseInt(t);
                    if (n < ms.minZoom) {
                        n = ms.minZoom;
                    }
                    if (n > ms.maxZoom) {
                        n = ms.maxZoom;
                    }
                    vs.testImageRange = vs.testImage = n;
                },
                reloadTimer: null,
                mapSourceValid: function (l) {
                    if (l) {
                        return scope.mapSourceValidItem(l);
                    }
                    if (!config().provider.mapSources || config().provider.mapSources.length == 0) {
                        return false;
                    }
                    for (var i = 0; i != config().provider.mapSources.length; i++) {
                        var r = scope.mapSourceValidItem(config().provider.mapSources[i]);
                        if (r == false) {
                            return false;
                        }
                    }
                    return true;
                },
                destroy: function () {
                    if (scope.reloadTimer != null) {
                        clearTimeout(scope.reloadTimer);
                        scope.reloadTimer = null;
                    }
                    event.cancel(id);
                    //angular.forEach(scope.gevents, function (gevent) {
                    //    gevent.removeHooks();
                    //});
                    scope.gevents = [];
                    if (scope.gmap) {
                        scope.gmap.remove();
                        scope.gmap = null;
                    }
                },
                reloadMap: function () {
                    scope.destroy();
                    sub.destroySubsystem();
                    if (scope.div) {
                        var div = document.getElementById(scope.div);
                        var counter = 100;      //  Put in place incase of horrible errors

                        var timer = setInterval(function () {
                            if (--counter < 0) {
                                clearInterval(timer);
                                scope.loadMap.call(scope);
                            }
                            try {
                                var child = div.firstChild;
                                if (child) {
                                    div.removeChild(child);
                                } else {
                                    counter = 0;
                                }
                            }
                            catch (oh) {
                                counter = 0;
                            }
                        }, 1);
                    } else {
                        scope.loadMap.call(scope);
                    }
                },
                parse: function (text) {
                    if (typeof text !== 'string') {
                        return false;
                    }
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
                isElementInViewport: function (el) {
                    var rect = el.getBoundingClientRect();
                    return (
                        (rect.top <= (window.innerHeight || document.documentElement.clientHeight)) && ((rect.top + rect.height) >= 0) &&
                        (rect.left <= (window.innerWidth || document.documentElement.clientWidth)) && ((rect.left + rect.width) >= 0)
                    );
                },
                toString: function (datum, precision) {
                    function encodelatlng(latlng) {
                        return Number(latlng).toFixed(precision).replace(/\.?0+$/, '');
                    }
                    return encodelatlng(datum.latitude) + ',' + encodelatlng(datum.longitude);
                },
                setDatum: function () {
                    var datum = scope.toString.call(scope, vm().position.datum, vm().position.precision);
                    if (typeof datum !== 'boolean') {
                        store().position.datum = datum;
                        vm().position.datumText = datum;
                        vm().position.datumStyle = {};
                    } else {
                        vm().position.datumStyle = { 'color': 'red' };
                    }
                },
                setMarker: function (quick) {
                    if (scope.gmap && scope.gmarker) {
                        var latlng = new L.LatLng(vm().position.datum.latitude, vm().position.datum.longitude);
                        scope.gmarker.setLatLng(latlng);
                        if (quick) {
                            scope.gmap.setView(latlng);
                        } else {
                            scope.gmap.panTo(latlng);
                        }
                    }
                },
                loadMapWait: null,
                div: null,
                divoldsize: 0,
                visible: false,
                divwait: 0,
                superWaiter: null,
                layers: null,
                minZoom: null,
                maxZoom: null,
                loadMap: function () {
                    if (scope.loadMapWait == null) {
                        scope.loadMapWait = setTimeout(function () {
                            //sub.originalConsole.warn(id + ': Loading map');
                            scope.initValues();
                            scope.loadMapWait = null;
                            vm().status = {
                                loading: true,
                                reload: true
                            };
                            vm().showMap = false;
                            scope.gmap = null;
                            scope.gmarker = null;
                            scope.gevents = [],
                            scope.div = null;
                            scope.divoldsize = 0;
                            scope.divwait = sub.timeout / sub.poll;
                            scope.layers = null;
                            scope.minZoom = null;
                            scope.maxZoom = null;
                            event.register(id, 'gmaperror', scope, this, function (s) {
                                //sub.originalConsole.warn(id + ': Map error');
                                vm().status = {
                                    failed: true,
                                    reload: true
                                };
                                event.cancel(id);
                                clearInterval(scope.superWaiter);
                                scope.superWaiter = null;
                                updateView();
                            });
                            event.register(id, 'gmapkilled', scope, this, function (s) {
                                //sub.originalConsole.warn(id + ': Map killed');
                                vm().status = {
                                    reload: true
                                };
                                event.cancel(id);
                                clearInterval(scope.superWaiter);
                                scope.superWaiter = null;
                                updateView();
                            });

                            event.register(id, 'gmaprefresh', scope, this, function (s) {
                                //sub.originalConsole.warn(id + ': Map refresh(). div=' + scope.div + ', gmap=' + scope.gmap);
                                if (!L) {
                                    scope.reloadMap.call(scope);
                                } else if (scope.div == null) {
                                    vm().status = {
                                        success: true,
                                        reload: true
                                    };
                                    scope.ignoreEvents = 0;
                                    scope.div = 'terratype_' + id + '_leafletv1_map';
                                    vm().showMap = true;
                                    updateView();
                                } else {
                                    var element = document.getElementById(scope.div);
                                    if (element == null) {
                                        if (scope.gmap == null && scope.divwait != 0) {
                                            scope.divwait--;
                                        } else {
                                            //sub.originalConsole.log(id + ' ' + scope.div + ' not present');
                                            scope.destroy.call(scope);
                                        }
                                    } else if (scope.layers == null) {
                                        var zoom = 0;
                                        scope.layers = [];
                                        for (var l = 0; l != config().provider.mapSources.length; l++) {
                                            var ms = config().provider.mapSources[l];
                                            var ts = scope.tileServerById[ms.tileServer.id];
                                            var options = JSON.parse(JSON.stringify(ts.options));
                                            options.minZoom = ms.minZoom;
                                            options.maxZoom = ms.maxZoom;
                                            options.attribution = ts.attribution,
                                            options.key = config().provider.mapSources[l].key
                                            scope.layers.push(L.tileLayer(ts.url, options));
                                            if (scope.minZoom == null || ms.minZoom < scope.minZoom) {
                                                scope.minZoom = ms.minZoom;
                                            }
                                            if (scope.maxZoom == null || ms.maxZoom > scope.minZoom) {
                                                scope.maxZoom = ms.maxZoom;
                                            }
                                        }
                                    } else if (scope.gmap == null) {
                                        if (store().zoom < scope.minZoom) {
                                            store().zoom = scope.minZoom;
                                        }
                                        if (store().zoom > scope.maxZoom) {
                                            store().zoom = scope.maxZoom;
                                        }
                                        var latlng = L.latLng(vm().position.datum.latitude, vm().position.datum.longitude);
                                        scope.gevents = [];
                                        scope.gmap = L.map(scope.div, {
                                            center: latlng,
                                            zoom: store().zoom,
                                            minZoom: scope.minZoom,
                                            maxZoom: scope.maxZoom,
                                            layers: scope.layers,
                                            scrollWheelZoom: false,
                                            attributionControl: false,
                                            zoomControl: false
                                        });
                                        scope.zoomControl = null;
                                        if (config().provider.zoomControl.enable) {
                                            scope.zoomControl = L.control.zoom({
                                                position: sub.controlPosition(config().provider.zoomControl.position)
                                            }).addTo(scope.gmap);
                                        }

                                        scope.gevents.push(scope.gmap.on('zoomend', function () {
                                            scope.eventZoom.call(scope);
                                        }));
                                        scope.gevents.push(scope.gmap.on('load', function () {
                                            scope.eventRefresh.call(scope);
                                        }));
                                        scope.gevents.push(scope.gmap.on('resize', function () {
                                            scope.eventCheckRefresh.call(scope);
                                        }));
                                        scope.gmarker = L.marker(latlng, {
                                            draggable: true,
                                            id: 'terratype_' + id + '_marker',
                                            icon: sub.icon.call(sub, config().icon)
                                        }).addTo(scope.gmap);
                                        scope.ginfo = null;
                                        if (store().label && typeof store().label.content == 'string' && store().label.content.trim() != '') {
                                            scope.ginfo = scope.gmarker.bindPopup(store().label.content);
                                        }
                                        scope.gevents.push(scope.gmarker.on('click', function () {
                                            if (scope.ignoreEvents > 0) {
                                                return;
                                            }
                                            if (scope.callEvent('icon-click') && scope.ginfo) {
                                                scope.ginfo.openPopup();
                                            }
                                        }));
                                        scope.gevents.push(scope.gmap.on('click', function () {
                                            if (scope.ignoreEvents > 0) {
                                                return;
                                            }
                                            if (scope.ginfo) {
                                                scope.ginfo.closePopup();
                                            }
                                            scope.callEvent('map-click');
                                        }));

                                        scope.gevents.push(scope.gmarker.on('moveend', function (marker) {
                                            scope.eventDrag.call(scope, marker);
                                        }));
                                        scope.setDatum.call(scope);

                                        updateView();
                                    } else {
                                        var newValue = element.parentElement.offsetTop + element.parentElement.offsetWidth;
                                        var newSize = element.clientHeight * element.clientWidth;
                                        var show = vm().showMap;
                                        var visible = show && scope.isElementInViewport(element);
                                        if (newValue != 0 && show == false) {
                                            vm().showMap = true;
                                            updateView();
                                            setTimeout(function () {
                                                if (document.getElementById(scope.div).hasChildNodes() == false) {
                                                    scope.reloadMap.call(scope);
                                                } else {
                                                    scope.eventRefresh.call(scope);
                                                }
                                            }, 1);
                                        } else if (newValue == 0 && show == true) {
                                            vm().showMap = false;
                                            scope.visible = false;
                                        }
                                        else if (visible == true && scope.divoldsize != 0 && newSize != 0 && scope.divoldsize != newSize) {
                                            scope.eventRefresh.call(scope);
                                            scope.visible = true;
                                        } else if (visible == true && scope.visible == false) {
                                            scope.eventRefresh.call(scope);
                                            scope.visible = true;
                                        } else if (visible == false && scope.visible == true) {
                                            scope.visible = false;
                                        }
                                        scope.divoldsize = newSize;
                                    }
                                }
                            });

                            if (!sub.running) {
                                sub.createSubsystem();
                            }
                        }, sub.poll);
                    }
                },
                eventZoom: function () {
                    if (scope.ignoreEvents > 0) {
                        return;
                    }
                    //sub.originalConsole.warn(id + ': eventZoom()');
                    store().zoom = scope.gmap.getZoom();
                },
                eventRefresh: function () {
                    if (scope.gmap == null || scope.ignoreEvents > 0) {
                        return;
                    }
                    //sub.originalConsole.warn(id + ': eventRefresh()');
                    scope.ignoreEvents++;
                    scope.gmap.setZoom(store().zoom);
                    scope.setMarker.call(scope, true);
                    scope.gmap.invalidateSize();
                    scope.ignoreEvents--;
                },
                eventCheckRefresh: function () {
                    if (scope.gmap.getBounds() && !scope.gmap.getBounds().contains(scope.gmarker.getLatLng())) {
                        scope.eventRefresh.call(scope);
                    }
                },
                eventDrag: function () {
                    if (scope.ignoreEvents > 0) {
                        return;
                    }
                    //sub.originalConsole.warn(id + ': eventDrag()');
                    scope.ignoreEvents++;
                    var latlng = scope.gmarker.getLatLng();
                    vm().position.datum = {
                        latitude: sub.round(latlng.lat, vm().position.precision),
                        longitude: sub.round(latlng.lng, vm().position.precision)
                    };
                    scope.setMarker.call(scope);
                    scope.setDatum.call(scope);
                    updateView();
                    scope.ignoreEvents--;
                },
                callEvent: function (id) {
                    for (var i = 0; i != scope.events.length; i++) {
                        if (scope.events[i].id == id) {
                            scope.events[i].func.call(scope.events[i].scope);
                        }
                    }

                }
            }
            scope.init(done);
        }
    }

    root.terratype.providers[identifier] = provider;
}(window));
