import { MapUi } from "./MapUi.js?v=20260317-1";
import { PlaceCollection } from "./PlaceCollection.js?v=20260317-1";
import { ScenePanelControl } from "./ScenePanelControl.js?v=20260317-1";
import { createPopupContent } from "./popupContent.js?v=20260317-1";

const DATA_URL = "./generated_data/points_places.json";
const COUNTRY_DATA_URL = "./generated_data/countries.geojson";
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/fiord";
const TERRAIN_SOURCE_ID = "travel-terrain";
const SATELLITE_SOURCE_ID = "travel-satellite";
const COUNTRY_SOURCE_ID = "travel-countries";
const PLACE_SOURCE_ID = "travel-places";
const SATELLITE_LAYER_ID = "travel-satellite-layer";
const HILLSHADE_LAYER_ID = "travel-hillshade-layer";
const VISITED_COUNTRY_FILL_LAYER_ID = "travel-visited-country-fill";
const VISITED_COUNTRY_GLOW_LAYER_ID = "travel-visited-country-glow";
const VISITED_COUNTRY_LINE_LAYER_ID = "travel-visited-country-line";
const PLACE_LAYER_ID = "travel-places-layer";
const TERRAIN_TILEJSON_URL = "https://demotiles.maplibre.org/terrain-tiles/tiles.json";
const SATELLITE_TILE_URL = "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg";
const SATELLITE_ATTRIBUTION =
    'Sentinel-2 cloudless - <a href="https://s2maps.eu" target="_blank" rel="noopener">s2maps.eu</a> by EOX IT Services GmbH';
const VISITED_COUNTRY_LAYER_IDS = [
    VISITED_COUNTRY_FILL_LAYER_ID,
    VISITED_COUNTRY_GLOW_LAYER_ID,
    VISITED_COUNTRY_LINE_LAYER_ID,
];

function waitForMapStyle(map) {
    if (typeof map.isStyleLoaded === "function" && map.isStyleLoaded()) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const handleLoad = () => {
            map.off("error", handleError);
            resolve();
        };

        const handleError = event => {
            map.off("style.load", handleLoad);
            reject(event?.error ?? new Error("Map style failed to load."));
        };

        map.once("style.load", handleLoad);
        map.once("error", handleError);
    });
}

function initializePopupCarousel(popup) {
    if (typeof bootstrap === "undefined") {
        return;
    }

    const popupElement = popup.getElement();
    if (!popupElement) {
        return;
    }

    popupElement.querySelectorAll(".carousel").forEach(element => {
        bootstrap.Carousel.getOrCreateInstance(element);
    });
}

function createMap() {
    if (typeof maplibregl === "undefined") {
        throw new Error("MapLibre GL JS did not load.");
    }

    const map = new maplibregl.Map({
        container: "map",
        style: MAP_STYLE_URL,
        center: [0, 20],
        zoom: 1.25,
        attributionControl: true,
        renderWorldCopies: false,
        maxPitch: 85,
    });

    map.addControl(
        new maplibregl.NavigationControl({
            visualizePitch: true,
            showCompass: true,
            showZoom: true,
        }),
        "top-right",
    );

    return map;
}

function applyGlobeBackdrop(map) {
    if (typeof map.setSky !== "function") {
        return;
    }

    map.setSky({
        "sky-color": "#02030a",
        "horizon-color": "#02030a",
        "fog-color": "#02030a",
        "sky-horizon-blend": 0.06,
        "horizon-fog-blend": 0.08,
        "fog-ground-blend": 0.05,
        "atmosphere-blend": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.18,
            3,
            0.12,
            5,
            0.08,
            7,
            0.03,
            8,
            0,
        ],
    });
}

function getFirstNonFillBackgroundLayerId(map) {
    const layers = map.getStyle()?.layers ?? [];
    return layers.find(layer => layer.type !== "background" && layer.type !== "fill")?.id;
}

function getFirstSymbolLayerId(map) {
    const layers = map.getStyle()?.layers ?? [];
    return layers.find(layer => layer.type === "symbol")?.id;
}

function setLayerVisibility(map, layerId, isVisible) {
    if (!map.getLayer(layerId)) {
        return;
    }

    map.setLayoutProperty(layerId, "visibility", isVisible ? "visible" : "none");
}

function syncTerrainMode(map) {
    const terrainEnabled = isTerrainEnabled(map);
    setLayerVisibility(map, SATELLITE_LAYER_ID, terrainEnabled);
    setLayerVisibility(map, HILLSHADE_LAYER_ID, terrainEnabled);
}

function setVisitedCountryVisibility(map, isVisible) {
    VISITED_COUNTRY_LAYER_IDS.forEach(layerId => {
        setLayerVisibility(map, layerId, isVisible);
    });
}

function fitMapToPlaces(map, places) {
    const coordinates = places.getCoordinates();
    if (!coordinates.length) {
        return;
    }

    const bounds = new maplibregl.LngLatBounds();
    coordinates.forEach(coordinate => bounds.extend(coordinate));

    map.fitBounds(bounds, {
        padding: 56,
        duration: 1200,
        maxZoom: 4.2,
    });
}

function addVisitedCountryLayers(map, places) {
    const visitedCountryNames = places.getVisitedCountryNames();
    if (!visitedCountryNames.length) {
        return;
    }

    if (!map.getSource(COUNTRY_SOURCE_ID)) {
        map.addSource(COUNTRY_SOURCE_ID, {
            type: "geojson",
            data: COUNTRY_DATA_URL,
        });
    }

    const beforeLayerId = getFirstSymbolLayerId(map);
    const visitedCountryFilter = ["match", ["get", "name"], visitedCountryNames, true, false];

    if (!map.getLayer(VISITED_COUNTRY_FILL_LAYER_ID)) {
        map.addLayer(
            {
                id: VISITED_COUNTRY_FILL_LAYER_ID,
                type: "fill",
                source: COUNTRY_SOURCE_ID,
                filter: visitedCountryFilter,
                paint: {
                    "fill-color": "#ff8e66",
                    "fill-opacity": 0.28,
                },
            },
            beforeLayerId,
        );
    }

    if (!map.getLayer(VISITED_COUNTRY_GLOW_LAYER_ID)) {
        map.addLayer(
            {
                id: VISITED_COUNTRY_GLOW_LAYER_ID,
                type: "line",
                source: COUNTRY_SOURCE_ID,
                filter: visitedCountryFilter,
                paint: {
                    "line-color": "#ff9b77",
                    "line-opacity": 0.7,
                    "line-width": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        0,
                        1.2,
                        3,
                        2.4,
                        6,
                        4.2,
                    ],
                    "line-blur": 1.4,
                },
            },
            beforeLayerId,
        );
    }

    if (!map.getLayer(VISITED_COUNTRY_LINE_LAYER_ID)) {
        map.addLayer(
            {
                id: VISITED_COUNTRY_LINE_LAYER_ID,
                type: "line",
                source: COUNTRY_SOURCE_ID,
                filter: visitedCountryFilter,
                paint: {
                    "line-color": "#ffe6d8",
                    "line-opacity": 0.95,
                    "line-width": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        0,
                        0.6,
                        3,
                        1.1,
                        6,
                        1.8,
                    ],
                },
            },
            beforeLayerId,
        );
    }
}

function addPlaceLayers(map, places) {
    if (!map.getSource(PLACE_SOURCE_ID)) {
        map.addSource(PLACE_SOURCE_ID, {
            type: "geojson",
            data: places.toFeatureCollection(createPopupContent),
        });
    }

    if (!map.getLayer(PLACE_LAYER_ID)) {
        map.addLayer({
            id: PLACE_LAYER_ID,
            type: "circle",
            source: PLACE_SOURCE_ID,
            paint: {
                "circle-color": "#ff845c",
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 1.2,
                "circle-radius": 4,
            },
        });
    }
}

function wirePlaceInteractions(map) {
    map.on("mouseenter", PLACE_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", PLACE_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
    });

    map.on("click", PLACE_LAYER_ID, event => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry?.type !== "Point") {
            return;
        }

        const coordinates = feature.geometry.coordinates.slice();
        const popupHtml = typeof feature.properties?.popupHtml === "string" ? feature.properties.popupHtml : "";

        while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        const popup = new maplibregl.Popup({
            offset: 18,
            maxWidth: "340px",
            closeButton: true,
        })
            .setLngLat(coordinates)
            .setHTML(popupHtml)
            .addTo(map);

        initializePopupCarousel(popup);
    });
}

function ensureTerrainSupport(map) {
    if (!map.getSource(TERRAIN_SOURCE_ID)) {
        map.addSource(TERRAIN_SOURCE_ID, {
            type: "raster-dem",
            url: TERRAIN_TILEJSON_URL,
            tileSize: 256,
        });
    }

    if (!map.getSource(SATELLITE_SOURCE_ID)) {
        map.addSource(SATELLITE_SOURCE_ID, {
            type: "raster",
            tiles: [SATELLITE_TILE_URL],
            tileSize: 256,
            attribution: SATELLITE_ATTRIBUTION,
        });
    }

    if (!map.getLayer(SATELLITE_LAYER_ID)) {
        map.addLayer(
            {
                id: SATELLITE_LAYER_ID,
                type: "raster",
                source: SATELLITE_SOURCE_ID,
                layout: {
                    visibility: "none",
                },
            },
            getFirstNonFillBackgroundLayerId(map),
        );
    }

    if (!map.getLayer(HILLSHADE_LAYER_ID)) {
        map.addLayer(
            {
                id: HILLSHADE_LAYER_ID,
                type: "hillshade",
                source: TERRAIN_SOURCE_ID,
                layout: {
                    visibility: "none",
                },
            },
            getFirstSymbolLayerId(map),
        );
    }

    syncTerrainMode(map);
}

function isGlobeEnabled(map) {
    const projection = typeof map.getProjection === "function" ? map.getProjection() : null;
    const projectionType = typeof projection === "string" ? projection : projection?.type ?? projection?.name ?? "mercator";
    return projectionType === "globe";
}

function isTerrainEnabled(map) {
    return typeof map.getTerrain === "function" && Boolean(map.getTerrain());
}

function setProjectionMode(map, useGlobe) {
    if (typeof map.setProjection !== "function") {
        return;
    }

    map.setProjection({ type: useGlobe ? "globe" : "mercator" });
}

function setTerrainMode(map, isEnabled) {
    if (typeof map.setTerrain !== "function") {
        return;
    }

    map.setTerrain(
        isEnabled
            ? {
                  source: TERRAIN_SOURCE_ID,
                  exaggeration: 1.18,
              }
            : null,
    );

    syncTerrainMode(map);
}

function addSceneControls(map) {
    let visitedCountriesVisible = true;

    map.addControl(
        new ScenePanelControl([
            {
                key: "globe",
                label: "Globe",
                isEnabled: () => isGlobeEnabled(map),
                onToggle: () => setProjectionMode(map, !isGlobeEnabled(map)),
            },
            {
                key: "terrain",
                label: "Terrain",
                isEnabled: () => isTerrainEnabled(map),
                onToggle: () => setTerrainMode(map, !isTerrainEnabled(map)),
            },
            {
                key: "countries",
                label: "Countries",
                isEnabled: () => visitedCountriesVisible,
                onToggle: () => {
                    visitedCountriesVisible = !visitedCountriesVisible;
                    setVisitedCountryVisibility(map, visitedCountriesVisible);
                },
            },
        ]),
        "top-right",
    );
}

async function initializeMap() {
    const ui = new MapUi();
    ui.setStatus("Loading globe...");

    try {
        const map = createMap();
        const [places] = await Promise.all([PlaceCollection.load(DATA_URL), waitForMapStyle(map)]);

        setProjectionMode(map, true);
        applyGlobeBackdrop(map);
        ensureTerrainSupport(map);
        addVisitedCountryLayers(map, places);
        addSceneControls(map);
        addPlaceLayers(map, places);
        wirePlaceInteractions(map);
        ui.renderStats(places);
        fitMapToPlaces(map, places);
        ui.setStatus("");
    } catch (error) {
        console.error("Error loading map:", error);
        ui.setStatus("Could not load the map. Check the console for details.", true);
    }
}

window.addEventListener("load", () => {
    void initializeMap();
});
