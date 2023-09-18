export class Blog {
    constructor(title, filePath, imagesPath) {
        this.title = title;
        this.filePath = filePath;
        this.imagesPath = imagesPath;
    }
}

export class Visit {
    constructor(visitDate, blogs = []) {
        this.visitDate = visitDate;
        this.blogs = blogs.map(blog => new Blog(blog.title, blog.filePath, blog.imagesPath));
    }

    addBlog(blog) {
        this.blogs.push(new Blog(blog.title, blog.filePath, blog.imagesPath));
    }
}

export class Place {
    constructor(latitude, longitude, country, city, visits = []) {
        this.country = country;
        this.city = city;
        this.latitude = latitude;
        this.longitude = longitude;
        this.visits = visits.map(visit => new Visit(visit.visitDate, visit.blogs));
        this.name = this.country + ' - ' + this.city;
        this.visitDates = [];
        this.imagePaths = [];
        this.blogs = [];

        this.aggregateData(this.visits);
    }

    addVisit(visit) {
        const newVisit = new Visit(visit.visitDate, visit.blogs);
        this.visits.push(newVisit);
        this.aggregateData([newVisit]);
    }

    aggregateData(visits) {
        visits.forEach(visit => {
            this.visitDates.push(visit.visitDate);

            visit.blogs.forEach(blog => {
                this.imagePaths.push(...blog.imagesPath);
                this.blogs.push({ title: blog.title, url: blog.filePath });
            });
        });
    }
}