import { Place } from "./Place.js?v=20260317-1";

const COUNTRY_NAME_ALIASES = {
    Serbia: "Republic of Serbia",
    Tanzania: "United Republic of Tanzania",
    USA: "United States of America",
};

export class PlaceCollection {
    constructor(places = []) {
        this.items = Array.isArray(places) ? places.map(place => this.toPlace(place)) : [];
    }

    static async load(url) {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Could not load place data (${response.status})`);
        }

        const jsonData = await response.json();
        return new PlaceCollection(jsonData);
    }

    get placeCount() {
        return this.items.length;
    }

    get countryCount() {
        return this.getVisitedCountryNames().length;
    }

    toPlace(place) {
        return new Place(place);
    }

    getVisitedCountryNames() {
        return [...new Set(this.items.map(place => this.toPlace(place).getCountryName(COUNTRY_NAME_ALIASES)).filter(Boolean))];
    }

    getCoordinates() {
        return this.items
            .map(place => this.toPlace(place))
            .filter(place => place.hasCoordinates())
            .map(place => place.getCoordinates());
    }

    toFeatureCollection(createPopupHtml) {
        return {
            type: "FeatureCollection",
            features: this.items
                .map(place => this.toPlace(place))
                .filter(place => place.hasCoordinates())
                .map((place, index) => ({
                    type: "Feature",
                    id: index,
                    geometry: {
                        type: "Point",
                        coordinates: place.getCoordinates(),
                    },
                    properties: {
                        popupHtml: createPopupHtml(place),
                    },
                })),
        };
    }
}
