import { Place} from "./Place.js";
import { createPopupContent } from './popupContent.js';


function parseYear(value) {
    if (typeof value !== 'string') return null;
    const year = Number.parseInt(value.split('-')[0], 10);
    return Number.isFinite(year) ? year : null;
}

function updateStats(jsonData) {
    const elCountries = document.getElementById('stat-countries');
    const elPlaces = document.getElementById('stat-places');
    const elTrips = document.getElementById('stat-trips');
    const elPhotos = document.getElementById('stat-photos');
    const elYears = document.getElementById('stat-years');
    const elFact = document.getElementById('stat-fact');

    if (!elCountries || !elPlaces || !elTrips || !elPhotos || !elYears || !elFact) {
        return;
    }

    const countries = new Set();
    let trips = 0;
    let photos = 0;
    const years = [];

    let topPlace = null;
    let topTrips = -1;

    jsonData.forEach(p => {
        if (p && typeof p.country === 'string') countries.add(p.country);

        const visitDates = Array.isArray(p.visitDates) ? p.visitDates : [];
        trips += visitDates.length;

        visitDates.forEach(d => {
            const y = parseYear(d);
            if (y != null) years.push(y);
        });

        const imgs = Array.isArray(p.images) ? p.images : [];
        photos += imgs.length;

        if (visitDates.length > topTrips) {
            topTrips = visitDates.length;
            topPlace = p;
        }
    });

    const placesCount = Array.isArray(jsonData) ? jsonData.length : 0;
    const minYear = years.length ? Math.min(...years) : null;
    const maxYear = years.length ? Math.max(...years) : null;

    elCountries.textContent = String(countries.size);
    elPlaces.textContent = String(placesCount);
    elTrips.textContent = String(trips);
    elPhotos.textContent = String(photos);

    if (minYear != null && maxYear != null) {
        elYears.textContent = `Years: ${minYear} → ${maxYear}`;
    } else {
        elYears.textContent = 'Years: –';
    }

    if (topPlace && topTrips > 0) {
        elFact.textContent = `Most visited: ${topPlace.city}, ${topPlace.country} (${topTrips} trips)`;
    } else {
        elFact.textContent = 'Most visited: –';
    }
}


window.onload = function () {
    var map = L.map('map').setView([0, 0], 3);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);





    fetch('./generated_data/points_places.json')
        .then(response => response.json())
        .then(jsonData => {
            updateStats(jsonData);

            const list_of_places = jsonData.map(placeData => 
                new Place(
                    placeData.latitude, 
                    placeData.longitude, 
                    placeData.country, 
                    placeData.city, 
                    placeData.visitDates,
                    placeData.images
                )
            );


            console.log(list_of_places);

            const markerGroup = L.featureGroup().addTo(map);

            list_of_places.forEach(place => {
                if (place.latitude == null || place.longitude == null) {
                    console.error(`Missing coordinates for ${place.city}, ${place.country}`);
                    return;
                }
                var marker = L.marker([place.latitude, place.longitude]).addTo(markerGroup);
                marker.on('click', function () {
                    var popupContent = createPopupContent(place);
                    var popup = L.popup()
                        .setLatLng([place.latitude, place.longitude])
                        .setContent(popupContent)
                        .openOn(map);
                });
            });

            if (markerGroup.getLayers().length > 0) {
                map.fitBounds(markerGroup.getBounds().pad(0.15));
            }
        })
        .catch(error => console.error('Error fetching JSON:', error));



};

