/**
 * Creates a popup content for a place marker on the map
 * 
 * The popup contains:
 * - An image carousel showing up to 5 images from the place
 * - The place name as a title
 * - Visit dates
 * - Links to blog posts about the place
 * 
 * @param {Place} place - The place object containing location info, images, blogs etc
 * @returns {string} HTML string for the popup content
 */
export function createPopupContent(place) {
    // Generate unique ID for carousel to avoid conflicts with multiple popups
    var uniqueCarouselId = `carousel-${Math.random().toString(36).substring(2, 15)}`;

    // Create carousel items from first 5 images
    var carouselImages = place.images.slice(0, 5).map((url, index) => `
        <div class="carousel-item ${index === 0 ? 'active' : ''}">
            <img src="${url}" class="d-block w-100 card-img-top carousel-img lazyload" alt="...">
        </div>
        `).join('');

    // Build carousel component with navigation buttons
    var carrousel = `
        <div id="${uniqueCarouselId}" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">
               ${carouselImages}
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#${uniqueCarouselId}" data-bs-slide="prev">
               <span class="carousel-control-prev-icon" aria-hidden="true"></span>
               <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#${uniqueCarouselId}" data-bs-slide="next">
               <span class="carousel-control-next-icon" aria-hidden="true"></span>
               <span class="visually-hidden">Next</span>
            </button>
        </div>
    `;


    // Format visit dates
    var visitDates = place.visitDates.map((date, index) =>
        `<p class="h8">${date}</p>`
    ).join('');

    // Combine all components into a Bootstrap card
    var popupContent = `
    <div class="card" style="width: 15rem;">
            ${carrousel}
            <h5 class="card-title card-header">${place.name}</h5>
            <div class="card-body">
            <div class="card-text"> 

            <ul class="list-group list-group-flush">
            <li class="list-group-item">Visit dates: ${visitDates}</li>
            </ul>
         
            </div>
          </div>
          
        </div>
    `;

    return popupContent;
}
