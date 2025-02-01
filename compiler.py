import os
import json
from geopy.geocoders import Photon
import time
import shutil

# ... (rest of your imports)
root_dir = "raw_data"
to_generate = "website/generated_data"

file_path = os.path.join(root_dir, "points_places_template.json")

def load_json_file(file_path):

    """
    Loads and parses a JSON file.

    Args:
        file_path (str): Path to the JSON file to load

    Returns:
        dict/list: Parsed JSON data

    Raises:
        FileNotFoundError: If the specified file does not exist
        json.JSONDecodeError: If the file contains invalid JSON
    """
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"Could not find JSON file: {file_path}")
    except json.JSONDecodeError as e:
        raise json.JSONDecodeError(f"Invalid JSON in file {file_path}: {str(e)}", e.doc, e.pos)




def add_latitude_longitude(places_list):
    geolocator = Photon(user_agent="geoapiExercises")

    for place in places_list:
        time.sleep(1)
        location = geolocator.geocode(f"{place['country']}, {place['city']}", language='en')
        if location:
            place['latitude'] = location.latitude
            place['longitude'] = location.longitude

def add_images_from_directory(places_list):
    """
    Adds an 'images' list attribute to each place containing paths to all images in its images_directory.
    
    Args:
        places_list (list): List of place dictionaries containing images_directory paths
        
    Returns:
        None - Modifies the places_list in place
    """
    for place in places_list:
        images = []
        if 'images_directory' in place:
            image_dir = os.path.join(root_dir, place['images_directory'])
            
            if os.path.exists(image_dir):
                # Walk through directory and find all image files
                for root, _, files in os.walk(image_dir):
                    for file in files:
                        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                            # Convert path to be relative to website/generated directory
                            rel_path = os.path.relpath(root, root_dir)
                            image_path = os.path.join('generated', rel_path, file)
                            images.append(image_path)
                            
        place['images'] = images

json_loaded = load_json_file(file_path)

add_latitude_longitude(json_loaded)
add_images_from_directory(json_loaded)

with open(to_generate+"/points_places.json", 'w') as file:
    json.dump(json_loaded, file, indent=4)

print(json_loaded)
