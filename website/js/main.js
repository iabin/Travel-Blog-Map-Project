import { Place } from "./Place.js";
import { createPopupContent } from "./popupContent.js";

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
const COUNTRY_NAME_ALIASES = {
    Serbia: "Republic of Serbia",
    Tanzania: "United Republic of Tanzania",
    USA: "United States of America",
};

function updateStats(jsonData) {
    const elCountries = document.getElementById("stat-countries");
    const elPlaces = document.getElementById("stat-places");

    if (!elCountries || !elPlaces) {
        return;
    }

    const countries = new Set();
    if (Array.isArray(jsonData)) {
        jsonData.forEach(place => {
            if (place && typeof place.country === "string") {
                countries.add(place.country);
            }
        });
    }

    elCountries.textContent = String(countries.size);
    elPlaces.textContent = String(Array.isArray(jsonData) ? jsonData.length : 0);
}

function setStatus(message, isError = false) {
    const statusEl = document.getElementById("map-status");

    if (!statusEl) {
        return;
    }

    if (!message) {
        statusEl.hidden = true;
        statusEl.textContent = "";
        statusEl.classList.remove("is-error");
        return;
    }

    statusEl.hidden = false;
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", isError);
}

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

async function loadPlaces() {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
        throw new Error(`Could not load place data (${response.status})`);
    }

    const jsonData = await response.json();
    return Array.isArray(jsonData) ? jsonData : [];
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

function buildPlaces(jsonData) {
    return jsonData.map(
        placeData =>
            new Place(
                placeData.latitude,
                placeData.longitude,
                placeData.country,
                placeData.city,
                placeData.visitDates,
                placeData.images,
            ),
    );
}

function getVisitedCountryNames(jsonData) {
    const visitedCountries = new Set();

    if (!Array.isArray(jsonData)) {
        return [];
    }

    jsonData.forEach(place => {
        if (!place || typeof place.country !== "string") {
            return;
        }

        const countryName = place.country.trim();
        if (!countryName) {
            return;
        }

        visitedCountries.add(COUNTRY_NAME_ALIASES[countryName] ?? countryName);
    });

    return [...visitedCountries];
}

function fitMapToPlaces(map, places) {
    const bounds = new maplibregl.LngLatBounds();
    let hasValidBounds = false;

    places.forEach(place => {
        if (place.latitude == null || place.longitude == null) {
            console.error(`Missing coordinates for ${place.city}, ${place.country}`);
            return;
        }

        bounds.extend([place.longitude, place.latitude]);
        hasValidBounds = true;
    });

    if (hasValidBounds) {
        map.fitBounds(bounds, {
            padding: 56,
            duration: 1200,
            maxZoom: 4.2,
        });
    }
}

function createPlaceFeatureCollection(places) {
    return {
        type: "FeatureCollection",
        features: places
            .filter(place => place.latitude != null && place.longitude != null)
            .map((place, index) => ({
                type: "Feature",
                id: index,
                geometry: {
                    type: "Point",
                    coordinates: [place.longitude, place.latitude],
                },
                properties: {
                    popupHtml: createPopupContent(place),
                },
            })),
    };
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
    const terrainEnabled = typeof map.getTerrain === "function" && Boolean(map.getTerrain());
    setLayerVisibility(map, SATELLITE_LAYER_ID, terrainEnabled);
    setLayerVisibility(map, HILLSHADE_LAYER_ID, terrainEnabled);
}

function addVisitedCountryLayers(map, jsonData) {
    const visitedCountryNames = getVisitedCountryNames(jsonData);
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
            data: createPlaceFeatureCollection(places),
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

function addSceneControls(map) {
    if (typeof maplibregl.GlobeControl === "function") {
        map.addControl(new maplibregl.GlobeControl(), "top-right");
    }

    if (typeof maplibregl.TerrainControl === "function") {
        map.addControl(
            new maplibregl.TerrainControl({
                source: TERRAIN_SOURCE_ID,
                exaggeration: 1.18,
            }),
            "top-right",
        );
    }

    map.on("terrain", () => {
        syncTerrainMode(map);
    });
}

async function initializeMap() {
    setStatus("Loading globe...");

    try {
        const map = createMap();
        const [jsonData] = await Promise.all([loadPlaces(), waitForMapStyle(map)]);
        const places = buildPlaces(jsonData);

        if (typeof map.setProjection === "function") {
            map.setProjection({ type: "globe" });
        }

        applyGlobeBackdrop(map);

        ensureTerrainSupport(map);
        addSceneControls(map);
        addVisitedCountryLayers(map, jsonData);
        addPlaceLayers(map, places);
        wirePlaceInteractions(map);
        updateStats(jsonData);
        fitMapToPlaces(map, places);
        setStatus("");
    } catch (error) {
        console.error("Error loading map:", error);
        setStatus("Could not load the map. Check the console for details.", true);
    }
}

window.addEventListener("load", () => {
    void initializeMap();
});
