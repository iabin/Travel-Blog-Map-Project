export class Place {
    constructor(latitude, longitude, country, city, visitDates = [], images = []) {
        this.country = country;
        this.city = city;
        this.latitude = latitude;
        this.longitude = longitude;
        this.visitDates = visitDates;
        this.images = images;
        this.name = this.country + ' - ' + this.city;
    }
}