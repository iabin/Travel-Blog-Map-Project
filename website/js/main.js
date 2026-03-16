import { Place } from "./Place.js";
import { createPopupContent } from "./popupContent.js";

const DATA_URL = "./generated_data/points_places.json";
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";
const TERRAIN_SOURCE_ID = "travel-terrain";
const HILLSHADE_SOURCE_ID = "travel-hillshade";
const HILLSHADE_LAYER_ID = "travel-hillshade-layer";
const TERRAIN_TILEJSON_URL = "https://demotiles.maplibre.org/terrain-tiles/tiles.json";
const TERRAIN_FOCUS_CITY_NAMES = new Set(["andermatt", "hockenhorn", "kilimanjaro", "bariloche", "cusco"]);
const DEFAULT_TERRAIN_FOCUS = {
    center: [8.18, 46.63],
    zoom: 6.6,
    pitch: 78,
    bearing: 28,
};

function updateStats(jsonData) {
    const elCountries = document.getElementById("stat-countries");
    const elPlaces = document.getElementById("stat-places");

    if (!elCountries || !elPlaces) {
        return;
    }

    const countries = new Set();
    if (Array.isArray(jsonData)) {
        jsonData.forEach(p => {
            if (p && typeof p.country === "string") countries.add(p.country);
        });
    }

    const placesCount = Array.isArray(jsonData) ? jsonData.length : 0;
    elCountries.textContent = String(countries.size);
    elPlaces.textContent = String(placesCount);
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

function renderPlaces(map, places) {
    const bounds = new maplibregl.LngLatBounds();
    let hasValidBounds = false;

    places.forEach(place => {
        if (place.latitude == null || place.longitude == null) {
            console.error(`Missing coordinates for ${place.city}, ${place.country}`);
            return;
        }

        const popup = new maplibregl.Popup({
            offset: 18,
            maxWidth: "340px",
            closeButton: true,
        }).setHTML(createPopupContent(place));

        popup.on("open", () => {
            initializePopupCarousel(popup);
        });

        const markerEl = document.createElement("button");
        markerEl.type = "button";
        markerEl.className = "place-marker";
        markerEl.setAttribute("aria-label", `${place.city}, ${place.country}`);

        new maplibregl.Marker({
            element: markerEl,
            anchor: "center",
        })
            .setLngLat([place.longitude, place.latitude])
            .setPopup(popup)
            .addTo(map);

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

function normalizeName(value) {
    return String(value ?? "").trim().toLowerCase();
}

function getTerrainFocus(places) {
    const mountainPlaces = places.filter(place => TERRAIN_FOCUS_CITY_NAMES.has(normalizeName(place.city)));

    if (mountainPlaces.length === 0) {
        return DEFAULT_TERRAIN_FOCUS;
    }

    const totals = mountainPlaces.reduce(
        (accumulator, place) => {
            accumulator.latitude += place.latitude;
            accumulator.longitude += place.longitude;
            return accumulator;
        },
        { latitude: 0, longitude: 0 },
    );

    return {
        center: [totals.longitude / mountainPlaces.length, totals.latitude / mountainPlaces.length],
        zoom: 6.8,
        pitch: 78,
        bearing: 28,
    };
}

function getFirstSymbolLayerId(map) {
    const layers = map.getStyle()?.layers ?? [];
    return layers.find(layer => layer.type === "symbol")?.id;
}

function setHillshadeVisibility(map, isVisible) {
    if (!map.getLayer(HILLSHADE_LAYER_ID)) {
        return;
    }

    map.setLayoutProperty(HILLSHADE_LAYER_ID, "visibility", isVisible ? "visible" : "none");
}

function ensureTerrainSupport(map) {
    if (!map.getSource(TERRAIN_SOURCE_ID)) {
        map.addSource(TERRAIN_SOURCE_ID, {
            type: "raster-dem",
            url: TERRAIN_TILEJSON_URL,
            tileSize: 256,
        });
    }

    if (!map.getSource(HILLSHADE_SOURCE_ID)) {
        map.addSource(HILLSHADE_SOURCE_ID, {
            type: "raster-dem",
            url: TERRAIN_TILEJSON_URL,
            tileSize: 256,
        });
    }

    if (!map.getLayer(HILLSHADE_LAYER_ID)) {
        map.addLayer(
            {
                id: HILLSHADE_LAYER_ID,
                type: "hillshade",
                source: HILLSHADE_SOURCE_ID,
                layout: {
                    visibility: "none",
                },
                paint: {
                    "hillshade-shadow-color": "#020611",
                    "hillshade-highlight-color": "#7aa2ff",
                    "hillshade-accent-color": "#0f1e38",
                    "hillshade-exaggeration": 0.28,
                },
            },
            getFirstSymbolLayerId(map),
        );
    }
}

function addSceneControls(map) {
    if (typeof maplibregl.GlobeControl === "function") {
        map.addControl(new maplibregl.GlobeControl(), "top-right");
    }

    if (typeof maplibregl.TerrainControl === "function") {
        map.addControl(
            new maplibregl.TerrainControl({
                source: TERRAIN_SOURCE_ID,
                exaggeration: 1.3,
            }),
            "top-right",
        );
    }
}

function attachTerrainCameraBehavior(map, terrainFocus) {
    if (typeof map.getTerrain !== "function") {
        return;
    }

    let lastTerrainEnabled = Boolean(map.getTerrain());

    map.on("terrain", () => {
        const terrainEnabled = Boolean(map.getTerrain());

        if (terrainEnabled === lastTerrainEnabled) {
            return;
        }

        lastTerrainEnabled = terrainEnabled;
        setHillshadeVisibility(map, terrainEnabled);

        if (!terrainEnabled) {
            map.easeTo({
                pitch: 0,
                bearing: 0,
                duration: 1100,
                essential: true,
            });
            return;
        }

        const currentCenter = map.getCenter();
        const currentZoom = map.getZoom();
        const targetCenter = currentZoom >= 5 ? [currentCenter.lng, currentCenter.lat] : terrainFocus.center;

        map.easeTo({
            center: targetCenter,
            zoom: Math.max(currentZoom, terrainFocus.zoom),
            pitch: terrainFocus.pitch,
            bearing: terrainFocus.bearing,
            duration: 1800,
            essential: true,
        });
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

        if (typeof map.setSky === "function") {
            map.setSky({
                "sky-color": "#02030b",
                "sky-horizon-blend": 0.22,
                "horizon-color": "#112447",
                "horizon-fog-blend": 0.22,
                "fog-color": "#020611",
                "fog-ground-blend": 0.1,
                "atmosphere-blend": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0,
                    1,
                    5,
                    0.92,
                    8,
                    0.35,
                    10,
                    0.12,
                ],
            });
        }

        ensureTerrainSupport(map);
        addSceneControls(map);
        attachTerrainCameraBehavior(map, getTerrainFocus(places));
        updateStats(jsonData);
        renderPlaces(map, places);
        setStatus("");
    } catch (error) {
        console.error("Error loading map:", error);
        setStatus("Could not load the globe. Check the console for details.", true);
    }
}

window.addEventListener("load", () => {
    void initializeMap();
});

