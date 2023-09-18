# Travel Blog Map Project

## Project Overview

This project is designed to help visualize travel blogs on a map interface. It consists of a data processing script (`compiler.py`) and a web interface to display the processed data on a map.

The `compiler.py` script processes a directory of travel blogs organized by country, city, and date, and converts this data into a JSON format that can be displayed on the website. The website then uses this data to display markers on a map, with popups that provide details about each blog post, including links to the posts and images.

## Directory Structure
The script expects a directory structure as below:

```
travel_raw_data/
├── [Country Name]/
│   ├── [City Name]/
│   │   ├── [YYYY-MM]/
│   │   │   ├── [Blog Title]/
│   │   │   │   ├── index.md or index.html (optional but no more than one)
│   │   │   │   └── images/ (optional)
│   │   │   │       ├── image1.jpg
│   │   │   │       ├── image2.jpg
│   │   │   │       └── ...
└── ...
```

### Description:
- `[Country Name]`: Directory name representing the name of the country.
- `[City Name]`: Directory name representing the name of the city.
- `[YYYY-MM]`: Directory representing the date of the visit in `YYYY-MM` format.
- `[Blog Title]`: Directory name representing the title of the blog.
- `index.md` or `index.html`: (Optional) A file containing the blog content for that particular visit. Only one of these should be present in a blog title directory.
- `images/`: (Optional) Directory holding images relevant to the blog post.

## Script Workflow
1. **Directory Structure Validation**: The script initially validates the directory structure ensuring that necessary folders are present and correctly structured.
2. **Data Retrieval**: The script then walks through the directory structure, extracting necessary information and organizing it into a dictionary.
3. **Latitude and Longitude Fetching**: Utilizes the geopy library to fetch latitude and longitude information for each city based on the city and country name.
4. **JSON File Generation**: The structured data is then converted to a JSON file.
5. **Directory Copying**: The original directory (`travel_raw_data`) is copied to a new location (`website/generated`) and the generated JSON file is saved in the new directory.

## How to Execute the Script

1. Ensure you have Python installed on your system.
2. Install necessary Python packages:
   ```
   pip install geopy
   ```
3. Place your raw data in a folder named `travel_raw_data` at the same level as the `compiler.py` script.
4. Run the `compiler.py` script:
   ```
   python compiler.py
   ```
5. The script will process the data, adding geolocation information and converting it into a format suitable for the website. The processed data will be saved as `points_places.json` in the `website/generated` directory.

## How to View the Website

After executing the script:

1. Navigate to the `website/generated` directory.
2. Open the `index.html` file in a web browser to view the website.
3. You will see markers on the map representing different blog posts. Clicking on a marker will display a popup with details about the blog post, including links to the post and images.

## Additional Information

- The website utilizes the Leaflet library for mapping functionalities and Bootstrap for styling.
- The `main.js` script handles the logic for displaying data on the map and other UI interactions.
- The `Place.js` script defines classes that structure the data for places, visits, and blogs, and contains methods to aggregate data from visits and blogs into `Place` objects.
- The `popupContent.js` script defines the structure/content of the popups that appear on the map when a place marker is clicked.

## Troubleshooting
If any issues occur during execution, the script will raise exceptions with descriptive error messages to help identify and rectify the problem.

## Contributing
Feel free to contribute to this project through pull requests or by reporting issues.

