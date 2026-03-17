export class Place {
    constructor(latitudeOrPlace = {}, longitude = null, country = "", city = "", visitDates = [], images = []) {
        const rawPlace =
            latitudeOrPlace && typeof latitudeOrPlace === "object" && !Array.isArray(latitudeOrPlace)
                ? latitudeOrPlace
                : {
                      latitude: latitudeOrPlace,
                      longitude,
                      country,
                      city,
                      visitDates,
                      images,
                  };

        this.latitude = typeof rawPlace.latitude === "number" ? rawPlace.latitude : null;
        this.longitude = typeof rawPlace.longitude === "number" ? rawPlace.longitude : null;
        this.country = typeof rawPlace.country === "string" ? rawPlace.country.trim() : "";
        this.city = typeof rawPlace.city === "string" ? rawPlace.city.trim() : "";
        this.visitDates = Array.isArray(rawPlace.visitDates) ? rawPlace.visitDates : [];
        this.images = Array.isArray(rawPlace.images) ? rawPlace.images : [];
    }

    get displayName() {
        return `${this.country} - ${this.city}`;
    }

    hasCoordinates() {
        return typeof this.latitude === "number" && typeof this.longitude === "number";
    }

    getCoordinates() {
        return [this.longitude, this.latitude];
    }

    getCountryName(countryAliases = {}) {
        return countryAliases[this.country] ?? this.country;
    }
}
