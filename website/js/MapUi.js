export class MapUi {
    constructor(documentRef = document) {
        this.statusEl = documentRef.getElementById("map-status");
        this.countriesEl = documentRef.getElementById("stat-countries");
        this.placesEl = documentRef.getElementById("stat-places");
    }

    setStatus(message, isError = false) {
        if (!this.statusEl) {
            return;
        }

        if (!message) {
            this.statusEl.hidden = true;
            this.statusEl.textContent = "";
            this.statusEl.classList.remove("is-error");
            return;
        }

        this.statusEl.hidden = false;
        this.statusEl.textContent = message;
        this.statusEl.classList.toggle("is-error", isError);
    }

    renderStats(places) {
        if (!this.countriesEl || !this.placesEl) {
            return;
        }

        this.countriesEl.textContent = String(places.countryCount);
        this.placesEl.textContent = String(places.placeCount);
    }
}
