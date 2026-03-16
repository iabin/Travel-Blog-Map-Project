import { Place } from "./Place.js";
import { createPopupContent } from "./popupContent.js";

const DATA_URL = "./generated_data/points_places.json";
const MAP_STYLE_URL = "https://demotiles.maplibre.org/globe.json";

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
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

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

async function initializeMap() {
    setStatus("Loading globe...");

    try {
        const map = createMap();
        const [jsonData] = await Promise.all([loadPlaces(), waitForMapStyle(map)]);

        map.setProjection({ type: "globe" });
        map.setFog({
            color: "#dce8ff",
            "high-color": "#1d3d64",
            "space-color": "#020b16",
            "horizon-blend": 0.1,
            "star-intensity": 0.22,
        });

        updateStats(jsonData);
        renderPlaces(map, buildPlaces(jsonData));
        setStatus("");
    } catch (error) {
        console.error("Error loading map:", error);
        setStatus("Could not load the globe. Check the console for details.", true);
    }
}

window.addEventListener("load", () => {
    void initializeMap();
});

