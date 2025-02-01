# Travel Blog Map Project
[see the website](https://iabin.github.io/Travel-Blog-Map-Project/website/)
## Project Overview


The **Travel Blog Map Project** is an interactive map visualization tool that showcases various travel locations. Utilizing a JSON data file containing detailed location information, the project automatically generates latitude and longitude coordinates, as well as image paths for each destination. The map displays markers for every location, each equipped with popups that reveal visit dates and photo galleries, providing an engaging way to explore travel experiences.

## Directory Structure


raw_data/
└── points_places_template.json # Template JSON with basic location data
website/
├── generated_data/
│ └── points_places.json # Auto-generated JSON with coordinates and images
├── js/
│ ├── main.js # Map initialization and data handling
│ ├── Place.js # Place class definition
│ └── popupContent.js # Popup content generation
├── css/
│ └── styles.css # Custom styles
├── libs/
│ ├── css/
│ │ ├── bootstrap.min.css # Bootstrap CSS
│ │ └── leaflet.css # Leaflet CSS
│ ├── js/
│ │ ├── bootstrap.min.js # Bootstrap JS
│ │ └── leaflet.js # Leaflet JS
│ └── css/
│ └── bootstrap.min.css.map # Source map for Bootstrap CSS
├── index.html # Main HTML file
└── .cursorignore # Files and directories to ignore during indexing



This script performs the following actions:

1. **Loads** the template JSON data from `raw_data/points_places_template.json`.
2. **Adds** latitude and longitude coordinates using the Geopy library.
3. **Compiles** a list of image paths from the specified directories.
4. **Generates** the final JSON file at `website/generated_data/points_places.json`.

### Launch the Website

After generating the JSON data, you can view the interactive map by opening the `index.html` file in your web browser.

#### Option 1: Open Directly

Navigate to the `website` directory and open `index.html` with your preferred web browser.


#### Option 2: Serve with a Local Web Server

For a better experience, especially when dealing with JavaScript modules, it's recommended to serve the website using a local web server.

**Using Python's SimpleHTTPServer:**


**Fields:**

- **country** (`string`): The name of the country.
- **city** (`string`): The name of the city or specific location.
- **visitDates** (`array of strings`): A list of dates when the location was visited.
- **latitude** (`number`): The latitude coordinate of the location.
- **longitude** (`number`): The longitude coordinate of the location.
- **images** (`array of strings`): A list of relative paths to images associated with the location. These paths are used to display image galleries in the map popups.

## JSON Fields Explained

### `country`

- **Type:** `string`
- **Description:** Specifies the country where the location is found.
- **Example:** `"Mexico"`

### `city`

- **Type:** `string`
- **Description:** Specifies the city or specific location name.
- **Example:** `"Cancun"`

### `visitDates`

- **Type:** `array of strings`
- **Description:** Contains the dates when the location was visited. Dates can be formatted as year (`"2021"`) or year-month (`"2021-02"`).
- **Example:** `["2021", "2022-05"]`

### `latitude`

- **Type:** `number`
- **Description:** Represents the geographical latitude of the location.
- **Example:** `21.1527467`

### `longitude`

- **Type:** `number`
- **Description:** Represents the geographical longitude of the location.
- **Example:** `-86.8425761`

### `images_directory`

- **Type:** `string`
- **Description:** Specifies the relative path to the directory containing images for the location. This field is used by the `compiler.py` script to gather all image file paths.
- **Example:** `"images/mexico/cancun"`

### `images`

- **Type:** `array of strings`
- **Description:** Contains relative paths to image files associated with the location. These images are displayed in a carousel within the map popups.
- **Example:**
  ```json
  [
      "generated/mexico/cancun/2021-02/cancun-beach/images/image1.jpg",
      "generated/mexico/cancun/2021-02/cancun-night/images/image2.jpg"
  ]
  ```

## Usage

1. **Add a New Location:**
   - Update the `raw_data/points_places_template.json` file with the new location details.
   - Specify the `country`, `city`, `visitDates`, and `images_directory` (if any).

2. **Generate Updated JSON:**
   - Run the `compiler.py` script to process the template and generate the updated `points_places.json` with coordinates and image paths.

3. **View the Map:**
   - Open the `index.html` file in a web browser or serve it via a local web server to see the updated map with the new location marker.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your enhancements.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
