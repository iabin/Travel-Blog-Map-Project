export function createPopupContent(place) {
    var uniqueCarouselId = `carousel-${Math.random().toString(36).substring(2, 15)}`;

    var carouselImages = place.imagePaths.slice(0, 5).map((url, index) => `
        <div class="carousel-item ${index === 0 ? 'active' : ''}">
            <img src="${url}" class="d-block w-100 card-img-top carousel-img" alt="...">
        </div>
        `).join('');

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

    var placeBlogs = place.blogs.map((blog, index) =>
        blog.url ?
            `<a href="${blog.url}" class="card-link h6">${blog.title}</a> <hr class="custom-hr">`
            : ``
    ).join('');

    var visitDates = place.visitDates.map((date, index) =>
        `<p class="h8">${date}</p>`
    ).join('');

    var popupContent = `

    <div class="card" style="width: 15rem;">
            ${carrousel}
            <h5 class="card-title card-header">${place.name}</h5>
            <div class="card-body">
            <div class="card-text"> 

            <ul class="list-group list-group-flush">
            <li class="list-group-item">Visit dates: ${visitDates}</li>
            <li class="list-group-item">${placeBlogs}</li>
            </ul>
         
            </div>
          </div>
          
        </div>
        </div>

    `;

    return popupContent;
}
