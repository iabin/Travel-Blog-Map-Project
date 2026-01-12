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
    var map = L.map("map").setView([0, 0], 3);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
    }).addTo(map);

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

            const markerGroup = L.featureGroup().addTo(map);

            list_of_places.forEach(place => {
                if (place.latitude == null || place.longitude == null) {
                    console.error(`Missing coordinates for ${place.city}, ${place.country}`);
                    return;
                }

                var marker = L.marker([place.latitude, place.longitude]).addTo(markerGroup);
                marker.on("click", function () {
                    var popupContent = createPopupContent(place);
                    L.popup()
                        .setLatLng([place.latitude, place.longitude])
                        .setContent(popupContent)
                        .openOn(map);
                });
            });

            if (markerGroup.getLayers().length > 0) {
                map.fitBounds(markerGroup.getBounds().pad(0.15));
            }
        })
        .catch(error => console.error("Error fetching JSON:", error));
};
import { createPopupContent } from './popupContent.js';

