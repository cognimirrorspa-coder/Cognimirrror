from PIL import Image
import numpy as np

try:
    img = Image.open('public/logo.jpg').convert('RGBA')
    data = np.array(img)
    
    # Find white pixels (allowing for slight jpeg artifacts)
    r, g, b, a = data.T
    white_areas = (r > 230) & (g > 230) & (b > 230)
    
    # Make white pixels transparent
    data[..., 3][white_areas.T] = 0
    
    # Create new image
    new_img = Image.fromarray(data)
    
    # Find bounding box (non-transparent pixels)
    bbox = new_img.getbbox()
    if bbox:
        # Crop to the actual cube
        new_img = new_img.crop(bbox)
    
    new_img.save('public/logo.png')
    print("Successfully processed logo")
except Exception as e:
    print("Error:", e)
