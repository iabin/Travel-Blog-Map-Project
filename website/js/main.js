import { Place } from "./Place.js";
import { createPopupContent } from "./popupContent.js";

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

window.onload = function () {
    const map = new maplibregl.Map({
        container: "map",
        style: "https://demotiles.maplibre.org/style.json",
        center: [0, 20],
        zoom: 1.35,
        projection: "globe",
        attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("style.load", () => {
        map.setFog({
            "horizon-blend": 0.14,
            color: "#e8f0ff",
            "high-color": "#d3e3ff",
            "space-color": "#0f1424",
            "star-intensity": 0.18,
        });
    });

    fetch("./generated_data/points_places.json")
        .then(response => response.json())
        .then(jsonData => {
            updateStats(jsonData);

            const list_of_places = jsonData.map(
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

            const bounds = new maplibregl.LngLatBounds();
            let hasValidBounds = false;

            list_of_places.forEach(place => {
                if (place.latitude == null || place.longitude == null) {
                    console.error(`Missing coordinates for ${place.city}, ${place.country}`);
                    return;
                }

                const popup = new maplibregl.Popup({
                    offset: 20,
                    maxWidth: "340px",
                    closeButton: true,
                }).setHTML(createPopupContent(place));

                popup.on("open", () => {
                    if (typeof bootstrap !== "undefined") {
                        document.querySelectorAll(".carousel").forEach(el => {
                            bootstrap.Carousel.getOrCreateInstance(el);
                        });
                    }
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
                    duration: 1300,
                    maxZoom: 4.2,
                });
            }
        })
        .catch(error => console.error("Error fetching JSON:", error));
};

