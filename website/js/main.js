import { Place} from "./Place.js";
import { createPopupContent } from './popupContent.js';


window.onload = function () {
    var map = L.map('map').setView([0, 0], 3);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);





    fetch('./generated_data/points_places.json')
        .then(response => response.json())
        .then(jsonData => {
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

            list_of_places.forEach(place => {
                if (place.latitude == null || place.longitude == null) {
                    console.error(`Missing coordinates for ${place.city}, ${place.country}`);
                    return;
                }
                var marker = L.marker([place.latitude, place.longitude]).addTo(map);
                marker.on('click', function () {
                    var popupContent = createPopupContent(place);
                    var popup = L.popup()
                        .setLatLng([place.latitude, place.longitude])
                        .setContent(popupContent)
                        .openOn(map);
                });
            });
        })
        .catch(error => console.error('Error fetching JSON:', error));



};

