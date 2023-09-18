import os
import json
from geopy.geocoders import Photon
import time
import shutil

# ... (rest of your imports)
root_dir = "travel_raw_data"
to_generate = "website/generated"

def validate_directory_structure(root_dir):
    for root, dirs, files in os.walk(root_dir):
        path_parts = os.path.relpath(root, root_dir).split(os.sep)
        
        # Check for the structure: $country/$city/$date
        if len(path_parts) == 3:
            country, city, date = path_parts
            if "images" in dirs:
                if len([f for f in os.listdir(os.path.join(root, "images")) if f.endswith(('.png', '.jpg'))]) == 0:
                    raise Exception(f"No images found in the images directory: {os.path.join(root, 'images')}")
                
        elif len(path_parts) == 2:
            # Check if at least one date folder exists in the city folder
            if not any(os.path.isdir(os.path.join(root, d)) for d in dirs):
                raise Exception(f"No date folders found in city directory: {root}")

        elif len(path_parts) == 1:
            # Check if at least one city folder exists in the country folder
            if not any(os.path.isdir(os.path.join(root, d)) for d in dirs):
                raise Exception(f"No city folders found in country directory: {root}")


def add_latitude_longitude(places_list):
    geolocator = Photon(user_agent="geoapiExercises")

    for place in places_list:
        time.sleep(1)
        location = geolocator.geocode(f"{place['country']}, {place['city']}", language='en')
        if location:
            place['latitude'] = location.latitude
            place['longitude'] = location.longitude

def get_directory_structure(root_dir):
    # Dictionary to hold the data
    places_dict = {}

    # Iterate through the root directory and subdirectories
    for root, dirs, files in os.walk(root_dir):
        # Get the relative path components
        no_root_dir = os.path.relpath(root, root_dir)
        new_root = os.path.join("generated", no_root_dir)
        path_parts = no_root_dir.split(os.sep)

        if len(path_parts) >= 3:
            country, city, date = path_parts[:3]

            # Get or create the dictionary for this country
            country_data = places_dict.setdefault(country, {})
            
            # Get or create the dictionary for this city in this country
            city_data = country_data.setdefault(city, {})
            
            # Get or create the dictionary for this date in this city in this country
            visit_data = city_data.setdefault(date, {})

            if len(path_parts) == 4:
                blog_title = path_parts[3]
                index_mds = [os.path.join(new_root, file) for file in files if file.endswith(('md', 'html'))]
                
                index_name = None

                if len(index_mds) > 1:
                    raise ValueError(f"More than one index.md file found in {new_root}")
                if len(index_mds) > 0:
                    index_name = index_mds[0]

                # Add the blog entry to the data structure
                blog_data = {
                    'title': blog_title.replace('-', ' '),
                    'filePath': index_name
                }
                # Assign the blog data to the correct key in the dictionary
                visit_data[blog_title] = blog_data
            if len(path_parts) == 5:
                # Assign the blog data to the correct key in the dictionary
                visit_data[blog_title]['imagesPath'] = [os.path.join(new_root, file) for file in files if file.endswith(('.png', '.jpg'))]
            if len(path_parts) > 5:
                raise ValueError(f"Directory structure not supported: {path_parts}")
            
    # Convert the data to JSON
    return places_dict


def transform_to_place_structure(places_dict):
    places_list = []
    for country, cities in places_dict.items():
        for city, city_data in cities.items():

            visits = []
            for date, blogs in city_data.items():
                visit_blogs = []
                for blogName, blogInfo in blogs.items():
                    visit_blogs.append({
                        "title": blogInfo['title'],
                        "filePath": blogInfo['filePath'],
                        "imagesPath": blogInfo['imagesPath']
                    })
                visits.append({
                    "visitDate": date,
                    "blogs": visit_blogs
                })

            place = {
                "country": country,
                "city": city,
                "visits": visits,
             }
            places_list.append(place)

    return places_list


validate_directory_structure(root_dir)

places_json = get_directory_structure(root_dir)


places_list = transform_to_place_structure(places_json)
add_latitude_longitude(places_list)

places_json = json.dumps(places_list, indent=4)


shutil.rmtree(to_generate)
shutil.copytree(root_dir,  to_generate)
with open(to_generate+"/points_places.json", 'w') as file:
    file.write(places_json)

print(places_json)
