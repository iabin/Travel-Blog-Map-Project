import os
import json
from geopy.geocoders import Photon
import time
import shutil

# ... (rest of your imports)
root_dir = "raw_data"
to_generate = "website/generated_data"
website_root = "website"

file_path = os.path.join(root_dir, "points_places_template.json")

existing_generated_path = os.path.join(to_generate, "points_places.json")

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


def _place_key(country, city):
    return (
        (country or "").strip().casefold(),
        (city or "").strip().casefold(),
    )


def load_existing_coordinates():
    if not os.path.exists(existing_generated_path):
        return {}

    try:
        existing = load_json_file(existing_generated_path)
    except Exception:
        return {}

    coords = {}
    if isinstance(existing, list):
        for place in existing:
            if not isinstance(place, dict):
                continue
            lat = place.get("latitude")
            lon = place.get("longitude")
            if lat is None or lon is None:
                continue
            coords[_place_key(place.get("country"), place.get("city"))] = (lat, lon)

    return coords




def add_latitude_longitude(places_list, existing_coords=None):
    geolocator = Photon(user_agent="geoapiExercises", timeout=8)

    if existing_coords is None:
        existing_coords = {}

    geocoded_this_run = 0
    missing_after = 0

    for place in places_list:
        if not isinstance(place, dict):
            continue

        # If template already has coordinates, keep them.
        if place.get('latitude') is not None and place.get('longitude') is not None:
            continue

        # Reuse previous generated coordinates if available.
        key = _place_key(place.get('country'), place.get('city'))
        if key in existing_coords:
            lat, lon = existing_coords[key]
            place['latitude'] = lat
            place['longitude'] = lon
            continue

        # Otherwise, geocode only for new/missing places.
        query = f"{place.get('city', '')}, {place.get('country', '')}"
        try:
            location = geolocator.geocode(query, language='en', timeout=8)
        except Exception:
            location = None

        if location:
            place['latitude'] = location.latitude
            place['longitude'] = location.longitude
            geocoded_this_run += 1
            time.sleep(0.2)
        else:
            missing_after += 1

    return geocoded_this_run, missing_after

def add_images_from_directory(places_list):
    """
    Adds an 'images' list attribute to each place containing paths to all images in its images_directory.
    
    Args:
        places_list (list): List of place dictionaries containing images_directory paths
        
    Returns:
        None - Modifies the places_list in place
    """
    generated_root = os.path.join(website_root, "generated")

    # Keep output deterministic: clean the generated folder each run.
    # (Safe because it's under the website folder and fully compiler-owned.)
    if os.path.exists(generated_root):
        shutil.rmtree(generated_root)
    os.makedirs(generated_root, exist_ok=True)

    for place in places_list:
        images = []
        images_dir_value = place.get('images_directory')
        if isinstance(images_dir_value, str) and images_dir_value.strip():
            image_dir = os.path.join(root_dir, images_dir_value.strip())
            
            if os.path.exists(image_dir):
                # Walk through directory and find all image files
                for root, _, files in os.walk(image_dir):
                    for file in files:
                        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                            # Convert path to be relative to raw_data, then copy into website/generated
                            rel_path = os.path.relpath(root, root_dir)
                            dest_dir = os.path.join(generated_root, rel_path)
                            os.makedirs(dest_dir, exist_ok=True)

                            src_path = os.path.join(root, file)
                            dest_path = os.path.join(dest_dir, file)
                            shutil.copy2(src_path, dest_path)

                            # URL relative to website root
                            image_url = os.path.join('generated', rel_path, file).replace('\\', '/')
                            images.append(image_url)
                            
        place['images'] = images

json_loaded = load_json_file(file_path)

os.makedirs(to_generate, exist_ok=True)
existing_coords = load_existing_coordinates()

geocoded_count, missing_count = add_latitude_longitude(json_loaded, existing_coords=existing_coords)
add_images_from_directory(json_loaded)

with open(to_generate+"/points_places.json", 'w') as file:
    json.dump(json_loaded, file, indent=4)

print(f"Generated {len(json_loaded)} places -> {to_generate}/points_places.json")
print(f"Reused coords: {max(len(existing_coords) - geocoded_count, 0)} | Geocoded this run: {geocoded_count} | Missing coords: {missing_count}")
