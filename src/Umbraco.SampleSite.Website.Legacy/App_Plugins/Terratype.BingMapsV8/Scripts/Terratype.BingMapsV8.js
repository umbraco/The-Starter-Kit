(function (root) {
    var identifier = 'Terratype.BingMapsV8';
    var Wgs84 = 'WGS84';
    var Gcj02 = 'GCJ02';

    var event = {
        events: [],
        register: function (id, name, scope, object, func) {
            //gm.originalConsole.log("Register " + name + ":" + id);

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
                    //gm.originalConsole.log("Cancel " + e.name + ":" + e.id);
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
            //gm.originalConsole.log(log);
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

    //  Subsystem that loads or destroys Bing Map library
    var gm = {
        originalConsole: root.console,
        domain: null,
        version: null,
        apiKey : null,
        coordinateSystem: null,
        forceHttps: false,
        language: null,
        subsystemUninitiated: 0,
        subsystemInit: 1,
        subsystemReadBingJs: 2,
        subsystemCheckBingJs: 3,
        subsystemLoadedBingJs: 4,
        subsystemCooloff: 5,
        subsystemCompleted: 6,
        status: 0,
        killswitch: false,
        poll: 100,
        timeout: 15000,
        fakeConsole: {
            isFake: true,
            error: function (a) {
                if ((a.indexOf('Bing Maps API') != -1 || a.indexOf('Bing Maps Javascript API') != -1) &&
                    (a.indexOf('MissingKeyMapError') != -1 || a.indexOf('ApiNotActivatedMapError') != -1 ||
                    a.indexOf('InvalidKeyMapError') != -1 || a.indexOf('not authorized') != -1 || a.indexOf('RefererNotAllowedMapError') != -1)) {
                    event.broadcast('gmaperror');
                    gm.destroySubsystem();
                    return;
                }
                try {
                    gm.originalConsole.warn(a);
                }
                catch (oh) {
                }
            },
            warn: function (a) {
                try {
                    gm.originalConsole.warn(a);
                }
                catch (oh) {
                }
            },
            log: function (a) {
                try {
                    gm.originalConsole.log(a);
                }
                catch (oh) {
                }
            }
        },
        installFakeConsole: function () {
            if (typeof (root.console.isFake) === 'undefined') {
                root.console = gm.fakeConsole;
            }
        },
        uninstallFakeConsole: function () {
            root.console = gm.originalConsole;
        },
        isBingMapsLoaded: function () {
            return angular.isDefined(root.Microsoft) && angular.isDefined(root.Microsoft.Maps);
        },
        uninstallScript: function (url) {
            var matches = document.getElementsByTagName('script');
            for (var i = matches.length; i >= 0; i--) {
                var match = matches[i];
                if (match && match.getAttribute('src') != null && match.getAttribute('src').indexOf(url) != -1) {
                    match.parentNode.removeChild(match)
                }
            }
        },
        destroySubsystem: function () {
            //gm.originalConsole.log('Destroying subsystem');
            if (gm.searchesTimer != null) {
                clearInterval(gm.searchesTimer);
                gm.searchesTimer = null;
            }
            gm.uninstallFakeConsole();
            delete root.Microsoft.Maps;
            delete root.$MicrosoftMaps8;
            root.Microsoft = {
                Maps: {
                    NetworkCallbacks: {
                        normal: function () { return false; }
                    },
                    GlobalConfig: {}
                }
            };
            if (gm.domain) {
                gm.uninstallScript(gm.domain);
                gm.domain = null;
            }
            gm.status = gm.subsystemUninitiated;
            gm.killswitch = true;
            gm.version = null;
            gm.apiKey = null;
            gm.coordinateSystem = null;
            gm.forceHttps = false;
            gm.language = null;
        },
        ticks: function () {
            return (new Date().getTime());
        },
        createSubsystem: function (version, apiKey, forceHttps, coordinateSystem, language) {
            //gm.originalConsole.log('Creating subsystem');
            root['terratypeBingMapsV8Callback'] = function () {
                if (gm.status == gm.subsystemInit || gm.status == gm.subsystemReadBingJs) {
                    gm.status = gm.subsystemCheckBingJs;
                };
            }
            var start = gm.ticks() + gm.timeout;
            var single = 0;
            var wait = setInterval(function () {
                //gm.originalConsole.warn('Waiting for previous subsystem to die');
                if (gm.ticks() > start) {
                    clearInterval(wait);
                    event.broadcast('gmapkilled');
                    gm.destroySubsystem();
                } else if (gm.status == gm.subsystemCompleted || gm.status == gm.subsystemUninitiated || gm.status == gm.subsystemInit) {
                    //gm.originalConsole.warn('Creating new subsystem');
                    clearInterval(wait);
                    if (!version) {
                        version = '3';  //  Stable release
                    }
                    gm.version = version;
                    gm.forceHttps = forceHttps;
                    var https = '';
                    if (forceHttps) {
                        https = 'https:';
                    }
                    gm.coordinateSystem = coordinateSystem;

                    gm.domain = https + ((coordinateSystem == Gcj02) ? '//www.bing.com/' : '//www.bing.com/');
                    gm.status = gm.subsystemInit;
                    gm.killswitch = false;

                    gm.language = language;
                    var lan = '';
                    if (language) {
                        lan = '&mkt=' + language;
                    }
                    start = gm.ticks() + gm.timeout;
                    var timer = setInterval(function () {
                        if (gm.killswitch) {
                            clearInterval(timer);
                        } else {
                            //gm.originalConsole.warn('Subsystem status ' + gm.status);
                            switch (gm.status)
                            {
                                case gm.subsystemInit:
                                    LazyLoad.js(gm.domain + 'api/maps/mapcontrol?branch=' + version + '&callback=terratypeBingMapsV8Callback' + lan, function () {
                                        //if (gm.status == gm.subsystemInit || gm.status == gm.subsystemReadBingJs) {
                                        //    gm.status = gm.subsystemCheckBingJs;
                                        //};
                                    });
                                    start = gm.ticks() + gm.timeout;
                                    gm.status = gm.subsystemReadBingJs;
                                    break;

                                case gm.subsystemReadBingJs:
                                    if (gm.ticks() > start) {
                                        clearInterval(timer);
                                        event.broadcast('gmaperror');
                                        gm.destroySubsystem();
                                    }
                                    break;

                                case gm.subsystemCheckBingJs:
                                    if (gm.isBingMapsLoaded()) {
                                        gm.installFakeConsole();
                                        gm.status = gm.subsystemLoadedBingJs;
                                        event.broadcast('gmaprefresh');
                                    } else if (gm.ticks() > start) {
                                        clearInterval(timer);
                                        event.broadcast('gmaperror');
                                        gm.destroySubsystem();
                                    }
                                    break;

                                case gm.subsystemLoadedBingJs:
                                    gm.status = gm.subsystemCooloff;
                                    start = gm.ticks() + gm.timeout;
                                    break;

                                case gm.subsystemCooloff:
                                case gm.subsystemCompleted:
                                    single = event.broadcastSingle('gmaprefresh', single);
                                    if (single == null) {
                                        clearInterval(timer);
                                        gm.destroySubsystem();
                                    } else if (gm.status == gm.subsystemCooloff && gm.ticks() > start) {
                                        gm.status = gm.subsystemCompleted;
                                        gm.uninstallFakeConsole();
                                    }
                                    break;
                            }
                        }
                    }, gm.poll);
                } else {
                    gm.killswitch = true;
                }
            }, gm.poll)
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
        mapTypeIds: function (basic, satellite, streetView, style) {
            var mapTypeIds = [];
            //  The order they are pushed sets the order of the buttons

            if (basic) {
                if (style != '') {
                    mapTypeIds.push(root.Microsoft.Maps.MapTypeId[style]);
                } else {
                    mapTypeIds.push(root.Microsoft.Maps.MapTypeId.road);
                }
            }
            if (satellite) {
                mapTypeIds.push(root.Microsoft.Maps.MapTypeId.aerial);
            }
            if (streetView) {
                mapTypeIds.push(root.Microsoft.Maps.MapTypeId.streetside);
            }
            if (mapTypeIds.length == 0) {
                mapTypeIds.push(root.Microsoft.Maps.MapTypeId.road);
            }

            return mapTypeIds;
        },
        round: function (num, decimals) {
            var sign = num >= 0 ? 1 : -1;
            var pow = Math.pow(10, decimals);
            return parseFloat((Math.round((num * pow) + (sign * 0.001)) / pow).toFixed(decimals));
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
        }
    }

    var provider = {
        identifier: identifier,
        datumWait: 330,
        css: [],
        js: [],
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
                        version: 'release',
                        forceHttps: true,
                        language: '',
                        predefineStyling: 'road',
                        showLabels: true,
                        variety: {
                            basic: true,
                            satellite: false,
                            streetView: false
                        },
                        scale: {
                            enable: true
                        },
                        breadcrumb: {
                            enable: true
                        },
                        dashboard: {
                            enable: true
                        },
                        traffic: {
                            enable: false,
                            legend: false
                        }
                    },
                    search: {
                        enable: 0,
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
                    config().provider = gm.mergeJson(scope.defaultConfig.provider, config().provider);
                    config().search = gm.mergeJson(scope.defaultConfig.search, config().search);
                },
                init: function () {
                    //event.cancel(id);
                    if (store().position) {
                        if (typeof store().position.datum === 'string') {
                            vm().position.datum = scope.parse.call(scope, store().position.datum);
                        }
                    }
                    if (vm().isPreview == false && config().provider && config().provider.version && store().position && store().position.id && vm().position.precision) {
                        scope.loadMap.call(scope);
                    }
                    done({
                        httpCalls: {
                            'apiKey': {
                                when: 'config.provider.id=' + identifier,
                                field: 'config.provider.apiKey',
                                values: []
                            }
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
                                scope.destroy();
                            }
                        },
                        setCoordinateSystem: function () {
                            if (store().position && store().position.id != gm.coordinateSystem) {
                                scope.reloadMap.call(scope);
                            }
                        },
                        setIcon: function () {
                            if (scope.gmarker) {
                                scope.gmarker.setOptions({
                                    icon: config().icon.url,
                                    anchor: new root.Microsoft.Maps.Point(
                                        gm.getAnchorHorizontal(config().icon.anchor.horizontal, config().icon.size.width),
                                        gm.getAnchorVertical(config().icon.anchor.vertical, config().icon.size.height))
                                });
                            }
                        },
                        forceHttpsChange: function () {
                            if (config().provider.forceHttps != gm.forceHttps) {
                                scope.reloadMap.call(scope);
                            }
                        },
                        languageChange: function () {
                            if (config().provider.language != gm.language) {
                                scope.reloadMap.call(scope);
                            }
                        },
                        versionChange: function () {
                            if (config().provider.version != gm.version) {
                                scope.reloadMap.call(scope);
                            }
                        },
                        styleChange: function () {
                            if (scope.gmap) {
                                var mapTypeIds = gm.mapTypeIds.call(gm, config().provider.variety.basic, config().provider.variety.satellite, config().provider.variety.streetView, config().provider.predefineStyling);
                                scope.gmap.setView({
                                    mapTypeId: mapTypeIds[0]
                                });
                            }
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
                        optionChange: function (reload) {
                            if (scope.gmap) {
                                scope.reloadMap.call(scope);

                                //var mapTypeIds = gm.mapTypeIds.call(gm, config().provider.variety.basic, config().provider.variety.satellite, config().provider.variety.streetView, config().provider.predefineStyling);
                                //scope.gmap.setOptions({
                                //    credentials: gm.credentials,
                                //    enableSearchLogo: false,
                                //    showBreadcrumb: config().provider.breadcrumb.enable,
                                //    showCopyright: false,
                                //    showDashboard: config().provider.dashboard.enable,
                                //    showMapTypeSelector: mapTypeIds.length > 1,
                                //    showScalebar: config().provider.scale.enable,
                                //    disableBirdseye: !config().provider.variety.satellite,
                                //    allowHidingLabelsOfRoad: !config().provider.showLabels
                                //});
                            }
                        },
                        searchChange: function () {
                            if (typeof config().search.enable == 'string') {
                                config().search.enable = parseInt(config().search.enable);
                            }
                            scope.deleteSearch.call(scope);
                            if (config().search.enable != 0) {
                                setTimeout(function () {
                                    scope.createSearch.call(scope);
                                }, 1);
                            }
                        },
                        reload: function () {
                            scope.reloadMap.call(scope);
                        },
                        addEvent: function (id, func, s) {
                            scope.events.push({ id: id, func: func, scope: s});
                        },
                        labelChange: function () {
                            if (scope.gmap) {
                                if (scope.ginfo) {
                                    delete scope.ginfo;
                                    scope.ginfo = null;
                                }
                                if (store().label && typeof store().label.content == 'string' && store().label.content.trim() != '') {
                                    scope.ginfo = new root.Microsoft.Maps.Infobox(scope.gmarker.getLocation(), {
                                        description: ' ',
                                        visible: false,
                                        pushpin: scope.gmarker
                                    });
                                    scope.ginfo._options.description = store().label.content;
                                    scope.ginfo.setMap(scope.gmap);
                                }
                            }
                        },
                        destroy: scope.destroy
                    });
                },
                destroy: function () {
                    event.cancel(id);
                    if (scope.loadMapWait) {
                        clearTimeout(scope.loadMapWait);
                        scope.loadMapWait = null;
                    }
                    if (scope.superWaiter) {
                        clearInterval(scope.superWaiter);
                        scope.superWaiter = null;
                    }
                    if (root.Microsoft && root.Microsoft.Maps && root.Microsoft.Maps.Events) {
                        angular.forEach(scope.gevents, function (gevent) {
                            root.Microsoft.Maps.Events.removeHandler(gevent);
                        });
                    }
                    if (scope.gmap) {
                        scope.gmap.dispose()
                    }
                    if (scope.coordEnter) {
                        scope.removeDomEvent(scope.coordEnter);
                        scope.coordEnter = null;
                    }
                    delete scope.gevents;
                    delete scope.gmap;
                    delete scope.gmarker;
                    delete scope.traffic;
                    scope.deleteSearch.call(scope);
                },
                reloadMap: function () {
                    scope.destroy();
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
                        var latlng = new root.Microsoft.Maps.Location(vm().position.datum.latitude, vm().position.datum.longitude);
                        scope.gmarker.setLocation(latlng);
                        scope.gmap.setView({
                            center: latlng
                        });
                    }
                },
                loadMapWait: null,
                div: null,
                divoldsize: 0,
                visible: false,
                divwait: 0,
                superWaiter: null,
                coordEnter: null,
                loadMap: function () {
                    if (scope.loadMapWait == null) {
                        scope.loadMapWait = setTimeout(function () {
                            //gm.originalConsole.warn(id + ': Loading map');
                            scope.initValues();
                            scope.loadMapWait = null;
                            vm().status = {
                                loading: true,
                                reload: true
                            };
                            vm().showMap = false;
                            scope.gmap = null;
                            scope.gmarker = null;
                            scope.gautocomplete = null;
                            scope.traffic = null;
                            scope.gevents = [],
                            scope.div = null;
                            scope.divoldsize = 0;
                            scope.divwait = gm.timeout / gm.poll;
                            event.register(id, 'gmaperror', scope, this, function (s) {
                                //gm.originalConsole.warn(id + ': Map error');
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
                                //gm.originalConsole.warn(id + ': Map killed');
                                vm().status = {
                                    reload: true
                                };
                                event.cancel(id);
                                clearInterval(scope.superWaiter);
                                scope.superWaiter = null;
                                updateView();
                            });
                            event.register(id, 'gmaprefresh', scope, this, function (s) {
                                //gm.originalConsole.warn(id + ': Map refresh(). div=' + scope.div + ', gmap=' + scope.gmap);
                                if (!root.Microsoft) {
                                    scope.reloadMap.call(scope);
                                } else if (scope.div == null) {
                                    vm().status = {
                                        success: true,
                                        reload: true
                                    };
                                    vm().provider.version = gm.version;
                                    vm().provider.versionMajor = 8;
                                    if (typeof config().search.enable == 'string') {
                                        config().search.enable = parseInt(config().search.enable);
                                    }

                                    //  Check that we have loaded with the right setting for us
                                    if (gm.forceHttps != config().provider.forceHttps ||
                                        gm.language != config().provider.language) {
                                        vm().status = {
                                            duplicate: true,
                                            reload: true
                                        };
                                        event.cancel(id);
                                        updateView();
                                        return;
                                    }
                                    scope.ignoreEvents = 0;
                                    scope.div = 'terratype_' + id + '_bingmapsv8_map';
                                    vm().showMap = true;
                                    updateView();
                                } else {
                                    var element = document.getElementById(scope.div);
                                    if (element == null) {
                                        if (scope.gmap == null && scope.divwait != 0) {
                                            scope.divwait--;
                                        } else {
                                            //gm.originalConsole.log(id + ' ' + scope.div + ' not present');
                                            scope.destroy.call(scope);
                                        }
                                    } else if (scope.gmap == null) {
                                        scope.gevents = [];
                                        var latlng = new root.Microsoft.Maps.Location(vm().position.datum.latitude, vm().position.datum.longitude);
                                        var mapTypeIds = gm.mapTypeIds.call(gm, config().provider.variety.basic, config().provider.variety.satellite, config().provider.variety.streetView, config().provider.predefineStyling);

                                        scope.gmap = new root.Microsoft.Maps.Map(element, {
                                            credentials: config().provider.apiKey,
                                            enableSearchLogo: false,
                                            showBreadcrumb: config().provider.breadcrumb.enable,
                                            showCopyright: false,
                                            showDashboard: config().provider.dashboard.enable,
                                            showMapTypeSelector: mapTypeIds.length > 1,
                                            showScalebar: config().provider.scale.enable,
                                            disableBirdseye: !config().provider.variety.satellite,
                                            disableScrollWheelZoom: true,
                                            labelOverlay: config().provider.showLabels ? root.Microsoft.Maps.LabelOverlay.visible : root.Microsoft.Maps.LabelOverlay.hidden,
                                            allowHidingLabelsOfRoad: !config().provider.showLabels,
                                            showMapLabels: config().provider.showLabels,
                                            mapTypeId: mapTypeIds[0],
                                            fixedMapPosition: true      //  We will monitor map resizes and redraw manually
                                        });
                                        scope.gmap.setView({
                                            center: latlng,
                                            zoom: store().zoom,
                                            mapTypeId: mapTypeIds[0],
                                            labelOverlay: config().provider.showLabels ? root.Microsoft.Maps.LabelOverlay.visible : root.Microsoft.Maps.LabelOverlay.hidden,
                                        });

                                        scope.gevents.push(root.Microsoft.Maps.Events.addHandler(scope.gmap, 'viewchangeend', function () {
                                            if (scope.gmap.getZoom() != store().zoom) {
                                                scope.eventZoom.call(scope);
                                            }
                                        }));
                                        scope.gmarker = new root.Microsoft.Maps.Pushpin(latlng, {
                                            id: 'terratype_' + id + '_marker',
                                            draggable: true,
                                            icon: config().icon.url,
                                            anchor: new root.Microsoft.Maps.Point(
                                                gm.getAnchorHorizontal(config().icon.anchor.horizontal, config().icon.size.width),
                                                gm.getAnchorVertical(config().icon.anchor.vertical, config().icon.size.height))
                                        });
                                        scope.gmap.entities.push(scope.gmarker);
                                        scope.ginfo = null;
                                        if (store().label && typeof store().label.content == 'string' && store().label.content.trim() != '') {
                                            scope.ginfo = new root.Microsoft.Maps.Infobox(latlng, {
                                                description: ' ',
                                                visible: false,
                                                pushpin: scope.gmarker
                                            });
                                            scope.ginfo._options.description = store().label.content;
                                            scope.ginfo.setMap(scope.gmap);
                                        }
                                        scope.gevents.push(root.Microsoft.Maps.Events.addHandler(scope.gmarker, 'click', function () {
                                            if (scope.ignoreEvents > 0) {
                                                return;
                                            }
                                            if (scope.callEvent('icon-click') && scope.ginfo) {
                                                scope.ginfo.setOptions({
                                                    visible: !scope.ginfo.getVisible()
                                                });
                                            }
                                        }));
                                        scope.gevents.push(root.Microsoft.Maps.Events.addHandler(scope.gmap, 'click', function () {
                                            if (scope.ignoreEvents > 0) {
                                                return;
                                            }
                                            if (scope.ginfo && scope.ginfo.getVisible()) {
                                                scope.ginfo.setOptions({
                                                    visible: false
                                                });
                                            }
                                            scope.callEvent('map-click');
                                        }));

                                        scope.gevents.push(root.Microsoft.Maps.Events.addHandler(scope.gmarker, 'dragend', function () {
                                            scope.eventDrag.call(scope);
                                        }));

                                        if (config().search.enable != 0) {
                                            scope.createSearch.call(scope);
                                        }
                                        if (config().provider.traffic.enable == true) {
                                            root.Microsoft.Maps.loadModule('Microsoft.Maps.Traffic', function () {
                                                scope.traffic = new root.Microsoft.Maps.Traffic.TrafficManager(scope.gmap);
                                                scope.traffic.show();
                                                if (config().provider.traffic.legend) {
                                                    scope.traffic.showLegend();
                                                } else {
                                                    scope.traffic.hideLegend();
                                                }
                                            });
                                        }
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

                            if (gm.status == gm.subsystemUninitiated) {
                                gm.createSubsystem(config().provider.version, config().provider.apiKey, config().provider.forceHttps,
                                    store().position.id, config().provider.language);
                            }

                            //  Check that the subsystem is working
                            count = 0;
                            scope.superWaiter = setInterval(function () {
                                function go() {
                                    //  Error with subsystem, it isn't loading, only thing we can do is try again
                                    if (count > 5) {
                                        vm().status = {
                                            error: true,
                                            reload: true
                                        };
                                        clearInterval(scope.superWaiter);
                                        scope.superWaiter = null;
                                        updateView();
                                    }

                                    gm.createSubsystem(config().provider.version, config().provider.apiKey, config().provider.forceHttps,
                                        store().position.id, config().provider.language);
                                    count++;
                                }

                                if (gm.status != gm.subsystemCooloff && gm.status != gm.subsystemCompleted) {
                                    go();
                                } else if (scope.div == null || scope.gmap == null || document.getElementById(scope.div) == null || document.getElementById(scope.div).hasChildNodes() == false) {
                                    gm.destroySubsystem();
                                    setTimeout(go, 1);
                                } else {
                                    vm().status = {
                                        success: true
                                    };
                                    clearInterval(scope.superWaiter);
                                    scope.superWaiter = null;
                                    updateView();
                                }
                            }, gm.timeout);
                        }, gm.poll);
                    }
                },
                eventZoom: function () {
                    if (scope.ignoreEvents > 0) {
                        return;
                    }
                    store().zoom = scope.gmap.getZoom();
                },
                eventRefresh: function () {
                    if (scope.gmap == null || scope.ignoreEvents > 0) {
                        return;
                    }
                    scope.ignoreEvents++;
                    scope.gmap.setView({
                        zoom: store().zoom
                    });
                    scope.setMarker.call(scope, true);
                    var mapId = scope.gmap.getMapTypeId();
                    var mapTypeIds = gm.mapTypeIds.call(gm, config().provider.variety.basic, config().provider.variety.satellite, config().provider.variety.streetView, config().provider.predefineStyling);
                    var found = false;
                    for (var i = 0; i != mapTypeIds.length; i++) {
                        if (mapTypeIds[i] == mapId) {
                            found = true;
                            break;
                        }
                    }
                    if (found == false) {
                        mapId = mapTypeIds[i];
                    }
                    scope.gmap.setMapType(Microsoft.Maps.MapTypeId.mercator);
                    setTimeout(function () {
                        scope.gmap.setMapType(mapId);
                        scope.ignoreEvents--;
                    }, 1)
                },
                eventCheckRefresh: function () {
                    if (scope.gmap.getBounds() && !scope.gmap.getBounds().contains(scope.gmarker.getLocation())) {
                        scope.eventRefresh.call(scope);
                    }
                },
                eventDrag: function () {
                    if (scope.ignoreEvents > 0) {
                        return;
                    }
                    scope.ignoreEvents++;
                    vm().position.datum = {
                        latitude: gm.round(scope.gmarker.getLocation().latitude, vm().position.precision),
                        longitude: gm.round(scope.gmarker.getLocation().longitude, vm().position.precision)
                    };
                    scope.setMarker.call(scope);
                    scope.setDatum.call(scope);
                    updateView();
                    scope.ignoreEvents--;
                },
                eventLookup: function (location, name) {
                    if (scope.ignoreEvents > 0) {
                        return;
                    }
                    scope.ignoreEvents++;
                    store().lookup = name;
                    vm().position.datum = {
                        latitude: gm.round(location.latitude, vm().position.precision),
                        longitude: gm.round(location.longitude, vm().position.precision)
                    };
                    scope.setMarker.call(scope);
                    scope.setDatum.call(scope);
                    updateView();
                    scope.ignoreEvents--;
                },
                searchLookupElement: function (autosuggest) {
                    if (typeof autosuggest === 'undefined') {
                        autosuggest = config().search.enable;
                    }
                    return document.getElementById('terratype_' + id + '_bingmapsv8_lookup_' + ((autosuggest == 2) ? 'autosuggest' : 'normal'));
                },
                searchResultElement: function () {
                    return document.getElementById('terratype_' + id + '_bingmapsv8_lookup_results');
                },
                lastSearch: null,
                doSearch: function (e) {
                    var lookup = scope.searchLookupElement();
                    if (e.which == 13) {
                        if (scope.lastSearch != lookup.value) {
                            scope.lastSearch = lookup.value;
                            if (scope.searchManager.geocode) {
                                scope.searchManager.geocode({
                                    callback: function (result) {
                                        if (result && result.results && result.results.length > 0) {
                                            scope.eventLookup.call(scope, result.results[0].location, result.results[0].name);
                                            $(lookup).css('color', '');
                                        } else {
                                            $(lookup).css('color', '#ff0000');
                                        }
                                        if (config().search.enable == 2) {
                                            $(scope.searchResultElement()).find('.MicrosoftMap .as_container_search').css('visibility', 'hidden');
                                        }
                                    },
                                    count: 1,
                                    where: lookup.value,
                                    timeout: 5,
                                    errorCallback: function () {
                                        $(lookup).css('color', '#ff0000');
                                    }
                                });
                            }
                        }
                        return e.preventDefault();
                    } else {
                        $(lookup).css('color', '');
                    }
                },
                searchManager: null,
                autoSuggestManager: null,
                createSearch: function (e) {
                    if (config().search.enable == 0 || scope.searchLookupElement() == null) {
                        return;
                    }
                    function ready1() {
                        scope.searchManager = new root.Microsoft.Maps.Search.SearchManager(scope.gmap);
                        $(scope.searchLookupElement()).on('keypress keydown', scope.doSearch);
                    }
                    function ready2() {
                        scope.autoSuggestManager = new root.Microsoft.Maps.AutosuggestManager({
                            maxResults: 5,
                            map: scope.gmap,
                            addressSuggestions: true,
                            autoDetectLocation: false,
                            placeSuggestions: true,
                            useMapView: false,
                            userLocation: false
                        });
                        scope.autoSuggestManager.attachAutosuggest(scope.searchLookupElement(), scope.searchResultElement(), function (result) {
                            if (result && result.location) {
                                scope.eventLookup.call(scope, result.location, result.formattedSuggestion);
                            }
                        });
                    }

                    if (root.Microsoft.Maps.Search) {
                        ready1();
                    } else {
                        root.Microsoft.Maps.loadModule('Microsoft.Maps.Search', {
                            callback: function () {
                                ready1();
                            }
                        });
                    }
                    if (config().search.enable == 2) {
                        if (root.Microsoft.Maps.AutosuggestManager) {
                            ready2();
                        } else {
                            root.Microsoft.Maps.loadModule('Microsoft.Maps.AutoSuggest', function () {
                                ready2();
                            });
                        }
                    }
                },
                deleteSearch: function () {
                    if (scope.autoSuggestManager) {
                        scope.autoSuggestManager.detachAutosuggest();
                        scope.autoSuggestManager.dispose();
                        scope.autoSuggestManager = null;
                    }
                    if (scope.searchManager) {
                        //  Doesn't seem a way to remove this
                    }
                    $(scope.searchLookupElement(false)).off('keypress keydown');
                    $(scope.searchLookupElement(true)).off('keypress keydown');
                },
                callEvent: function (id) {
                    for (var i = 0; i != scope.events.length; i++) {
                        if (scope.events[i].id == id) {
                            scope.events[i].func.call(scope.events[i].scope);
                        }
                    }

                }
            }
            return scope.init(done);
        }
    }

    root.terratype.providers[identifier] = provider;
}(window));
