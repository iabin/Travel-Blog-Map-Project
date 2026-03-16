function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function createCarousel(images, uniqueCarouselId, placeName) {
    if (!Array.isArray(images) || images.length === 0) {
        return `<div class="place-popup-empty small">No photos added yet.</div>`;
    }

    const carouselImages = images.slice(0, 5).map((url, index) => `
        <div class="carousel-item ${index === 0 ? "active" : ""}">
            <img src="${url}" class="d-block w-100 card-img-top carousel-img" alt="${escapeHtml(placeName)} photo ${index + 1}">
        </div>
        `).join("");

    const controls = images.length > 1
        ? `
            <button class="carousel-control-prev" type="button" data-bs-target="#${uniqueCarouselId}" data-bs-slide="prev">
               <span class="carousel-control-prev-icon" aria-hidden="true"></span>
               <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${uniqueCarouselId}" data-bs-slide="next">
               <span class="carousel-control-next-icon" aria-hidden="true"></span>
               <span class="visually-hidden">Next</span>
            </button>
        `
        : "";

    return `
        <div id="${uniqueCarouselId}" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">
               ${carouselImages}
            </div>
            ${controls}
        </div>
    `;
}

export function createPopupContent(place) {
    const uniqueCarouselId = `carousel-${Math.random().toString(36).slice(2, 12)}`;
    const placeName = escapeHtml(place.name);
    const visitDates = Array.isArray(place.visitDates) && place.visitDates.length > 0
        ? place.visitDates.map(date => `<p class="mb-1">${escapeHtml(date)}</p>`).join("")
        : `<p class="mb-0 text-muted">No visit dates recorded yet.</p>`;

    return `
    <div class="card place-popup-card">
            ${createCarousel(place.images, uniqueCarouselId, place.name)}
            <h5 class="card-title card-header">${placeName}</h5>
            <div class="card-body">
            <div class="card-text">

            <ul class="list-group list-group-flush">
            <li class="list-group-item">
                <div class="fw-semibold mb-2">Visit dates</div>
                <div class="place-popup-dates">${visitDates}</div>
            </li>
            </ul>

            </div>
          </div>

        </div>
    `;
}
