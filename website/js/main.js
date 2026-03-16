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
    const popupHost = document.getElementById("place-popup");

    const viewer = new Cesium.Viewer("map", {
        timeline: false,
        animation: false,
        geocoder: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        shouldAnimate: false,
        homeButton: true,
        selectionIndicator: true,
        infoBox: false,
    });

    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
            url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            credit: "© OpenStreetMap contributors",
        }),
    );

    viewer.scene.globe.enableLighting = false;
    viewer.scene.skyAtmosphere.show = true;
    viewer.scene.globe.depthTestAgainstTerrain = false;

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

            const validCoords = [];

            list_of_places.forEach(place => {
                if (place.latitude == null || place.longitude == null) {
                    console.error(`Missing coordinates for ${place.city}, ${place.country}`);
                    return;
                }

                validCoords.push([place.longitude, place.latitude]);

                viewer.entities.add({
                    name: `${place.country} - ${place.city}`,
                    position: Cesium.Cartesian3.fromDegrees(place.longitude, place.latitude),
                    placeData: place,
                    point: {
                        pixelSize: 8,
                        color: Cesium.Color.fromCssColorString("#ff5a2a"),
                        outlineColor: Cesium.Color.WHITE,
                        outlineWidth: 2,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    },
                });
            });

            viewer.selectedEntityChanged.addEventListener(selected => {
                if (!popupHost) {
                    return;
                }

                if (!selected || !selected.placeData) {
                    popupHost.classList.add("d-none");
                    popupHost.innerHTML = "";
                    return;
                }

                popupHost.classList.remove("d-none");
                popupHost.innerHTML = `
                    <div class="popup-actions">
                        <button type="button" class="btn btn-sm btn-light" id="close-place-popup" aria-label="Close">Close</button>
                    </div>
                    ${createPopupContent(selected.placeData)}
                `;

                const closeBtn = document.getElementById("close-place-popup");
                if (closeBtn) {
                    closeBtn.addEventListener("click", () => {
                        viewer.selectedEntity = undefined;
                    });
                }

                if (typeof bootstrap !== "undefined") {
                    popupHost.querySelectorAll(".carousel").forEach(el => {
                        bootstrap.Carousel.getOrCreateInstance(el);
                    });
                }
            });

            if (validCoords.length > 0) {
                viewer.zoomTo(viewer.entities, new Cesium.HeadingPitchRange(0, -1.2, 22000000));
            }
        })
        .catch(error => console.error("Error fetching JSON:", error));
};

