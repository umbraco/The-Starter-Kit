(function (root) {

    var Wgs84 = 'WGS84';
    var Gcj02 = 'GCJ02';

    if (!root.terratype) {
        root.terratype = {};
    }
    root.terratype.leaflet = {
        translate: false,
        tileServers:
        [
            //{
            //    id: 'Terratype',
            //    name: 'terratypeLeafletV1Terratype_name',
            //    description: 'terratypeLeafletV1Terratype_description',
            //    key: {
            //        enable: false,
            //        name: 'terratypeLeafletV1Terratype_keyName',
            //        description: 'terratypeLeafletV1Terratype_keyDescription',
            //        placeholder: 'terratypeLeafletV1Terratype_keyPlaceholder',
            //        url: 'terratypeLeafletV1Terratype_keyUrl'
            //    },
            //    tileServers: [
            //        {
            //            url: '//{s}.XXX/osmbright/{z}/{x}/{y}.png',
            //            id: 'Terratype.Standard',
            //            name: 'terratypeLeafletV1Terratype_standardName',
            //            attribution: 'terratypeLeafletV1Terratype_standardAttribution',
            //            coordinateSystems: [Wgs84],
            //            minZoom: 0,
            //            maxZoom: 19,
            //            options: {
            //                subdomains: 'abcdefgh'
            //            }
            //        },
            //        {
            //            url: '//{s}.XXX/redalert/{z}/{x}/{y}.png',
            //            id: 'Terratype.RedAlert',
            //            name: 'terratypeLeafletV1Terratype_redAlertName',
            //            attribution: 'terratypeLeafletV1Terratype_redAlertAttribution',
            //            coordinateSystems: [Wgs84],
            //            minZoom: 0,
            //            maxZoom: 19,
            //            options: {
            //                subdomains: 'abcdefgh'
            //            }
            //        },
            //        {
            //            url: '//{s}.XXX/ice/{z}/{x}/{y}.png',
            //            id: 'Terratype.Ice',
            //            name: 'terratypeLeafletV1Terratype_iceName',
            //            attribution: 'terratypeLeafletV1Terratype_iceAttribution',
            //            coordinateSystems: [Wgs84],
            //            minZoom: 0,
            //            maxZoom: 19,
            //            options: {
            //                subdomains: 'abcdefgh'
            //            }
            //        },
            //    ]
            //},
            {
                id: 'OpenStreetMap',
                name: 'terratypeLeafletV1OpenStreetMap_name',
                description: 'terratypeLeafletV1OpenStreetMap_description',
                key: {
                    enable: false,
                },
                tileServers: [
                    {
                        url: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        id: 'OpenStreetMap.Mapnik',
                        name: 'terratypeLeafletV1OpenStreetMap_mapnikName',
                        attribution: 'terratypeLeafletV1OpenStreetMap_mapnikAttribution',
                        coordinateSystems: [Wgs84],
                        minZoom: 0,
                        maxZoom: 19,
                        options: {
                            subdomains: 'abc'
                        }
                    },
                    {
                        url: 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
                        id: 'OpenStreetMap.blackwhite',
                        name: 'terratypeLeafletV1OpenStreetMap_blackwhiteName',
                        attribution: 'terratypeLeafletV1OpenStreetMap_blackwhiteAttribution',
                        coordinateSystems: [Wgs84],
                        minZoom: 0,
                        maxZoom: 18,
                        options: {
                            subdomains: 'abc'
                        }
                    },
                    {
                        url: 'http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
                        id: 'OpenStreetMap.de',
                        name: 'terratypeLeafletV1OpenStreetMap_deName',
                        attribution: 'terratypeLeafletV1OpenStreetMap_deAttribution',
                        coordinateSystems: [Wgs84],
                        minZoom: 0,
                        maxZoom: 18,
                        options: {
                            subdomains: 'abc'
                        }
                    },
                    {
                        url: '//{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
                        id: 'OpenStreetMap.fr',
                        name: 'terratypeLeafletV1OpenStreetMap_frName',
                        attribution: 'terratypeLeafletV1OpenStreetMap_frAttribution',
                        coordinateSystems: [Wgs84],
                        minZoom: 0,
                        maxZoom: 20,
                        options: {
                            subdomains: 'abc'
                        }
                    },
                    {
                        url: '//{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                        id: 'OpenStreetMap.hot',
                        name: 'terratypeLeafletV1OpenStreetMap_hotName',
                        attribution: 'terratypeLeafletV1OpenStreetMap_hotAttribution',
                        coordinateSystems: [Wgs84],
                        minZoom: 0,
                        maxZoom: 19,
                        options: {
                            subdomains: 'abc'
                        }
                    }
                ]
            },
            {
                id: 'OpenSeaMap',
                name: 'terratypeLeafletV1OpenSeaMap_name',
                description: 'terratypeLeafletV1OpenSeaMap_description',
                key: {
                    enable: false,
                },
                tileServers: [
                    {
                        url: 'http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
                        id: 'OpenSeaMap.standard',
                        name: 'terratypeLeafletV1OpenSeaMap_standardName',
                        attribution: 'terratypeLeafletV1OpenSeaMap_standardAttribution',
                        coordinateSystems: [Wgs84],
                        minZoom: 0,
                        maxZoom: 18,
                        options: {
                            subdomains: ''
                        }
                    }
                ]
            },
            {
                id: 'OpenTopoMap',
                name: 'terratypeLeafletV1OpenTopoMap_name',
                description: 'terratypeLeafletV1OpenTopoMap_description',
                key: {
                    enable: false,
                },
                tileServers: [
                    {
                        url: '//{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                        id: 'OpenTopoMap.standard',
                        name: 'terratypeLeafletV1OpenSeaMap_standardName',
                        attribution: 'terratypeLeafletV1OpenSeaMap_standardAttribution',
                        coordinateSystems: [Wgs84],
                        minZoom: 0,
                        maxZoom: 17,
                        options: {
                            subdomains: 'abc'
                        }
                    }
                ]
            },
            /*{
                id: 'Thunderforest',
                name: 'terratypeLeafletV1Thunderforest_name',
                description: 'terratypeLeafletV1Thunderforest_description',
                key: {
                    enable: true,
                    name: 'terratypeLeafletV1Thunderforest_keyName',
                    description: 'terratypeLeafletV1Thunderforest_keyDescription',
                    placeholder: 'terratypeLeafletV1Thunderforest_keyPlaceholder',
                    url: 'terratypeLeafletV1Thunderforest_keyUrl'
                },
                tileServers: [
                    {
                        url: '//{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey={key}',
                        id: 'Thunderforest.OpenCycleMap',
                        name: 'terratypeLeafletV1Thunderforest_openCycleMapName',
                        attribution: 'terratypeLeafletV1Thunderforest_openCycleMapAttribution',
                        coordinateSystems: [Wgs84],
                        minZoom: 0,
                        maxZoom: 19,
                        options: {
                            subdomains: 'abc'
                        }
                    },
                    {
                        url: '//{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey={key}',
                        id: 'Thunderforest.Transport',
                        name: 'terratypeLeafletV1Thunderforest_transportName',
                        attribution: 'terratypeLeafletV1Thunderforest_transportAttribution',
                        coordinateSystems: [Wgs84],
                        minZoom: 0,
                        maxZoom: 19,
                        options: {
                            subdomains: 'abc'
                        }
                    }
                ]
            },*/
            {
                id: 'TianDiTu',
                name: 'terratypeLeafletV1TianDiTu_name',
                description: 'terratypeLeafletV1TianDiTu_description',
                key: {
                    enable: false,
                },
                tileServers: [
                    {
                        url: 'http://t{s}.tianditu.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}',
                        id: 'TianDiTu.Basic',
                        name: 'terratypeLeafletV1TianDiTu_basicName',
                        attribution: 'terratypeLeafletV1TianDiTu_basicName',
                        coordinateSystems: [Gcj02],
                        minZoom: 0,
                        maxZoom: 18,
                        options: {
                            subdomains: '01234567'
                        }
                    },
                    {
                        url: 'http://t{s}.tianditu.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}',
                        id: 'TianDiTu.Satellite',
                        name: 'terratypeLeafletV1TianDiTu_satelliteName',
                        attribution: 'terratypeLeafletV1TianDiTu_satelliteName',
                        coordinateSystems: [Gcj02],
                        minZoom: 0,
                        maxZoom: 18,
                        options: {
                            subdomains: '01234567'
                        }
                    },
                    {
                        url: 'http://t{s}.tianditu.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}',
                        id: 'TianDiTu.Terrain',
                        name: 'terratypeLeafletV1TianDiTu_terrainName',
                        attribution: 'terratypeLeafletV1TianDiTu_terrainName',
                        coordinateSystems: [Gcj02],
                        minZoom: 0,
                        maxZoom: 18,
                        options: {
                            subdomains: '01234567'
                        }
                    }
                ]
            },
            {
                id: 'GoogleCN',
                name: 'terratypeLeafletV1GoogleCN_name',
                description: 'terratypeLeafletV1GoogleCN_description',
                key: {
                    enable: false,
                },
                tileServers: [
                    {
                        url: 'http://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}',
                        id: 'GoogleCN.Basic',
                        name: 'terratypeLeafletV1GoogleCN_basicName',
                        attribution: 'terratypeLeafletV1GoogleCN_basicName',
                        coordinateSystems: [Gcj02],
                        minZoom: 0,
                        maxZoom: 18,
                        options: {
                            subdomains: ''
                        }
                    },
                    {
                        url: 'http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}',
                        id: 'GoogleCN.Satellite',
                        name: 'terratypeLeafletV1GoogleCN_satelliteName',
                        attribution: 'terratypeLeafletV1GoogleCN_satelliteName',
                        coordinateSystems: [Gcj02],
                        minZoom: 0,
                        maxZoom: 18,
                        options: {
                            subdomains: ''
                        }
                    }
                ]
            }
        ]
    };
}(window));
