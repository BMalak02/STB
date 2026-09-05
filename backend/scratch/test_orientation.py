# -*- coding: utf-8 -*-
import cv2
import numpy as np
from PIL import Image, ImageOps
import re

def auto_orient_image(image_path):
    # 1. Handle EXIF orientation
    try:
        pil_img = Image.open(image_path)
        pil_img = ImageOps.exif_transpose(pil_img)
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    except Exception:
        img = cv2.imread(image_path)

    if img is None:
        return None

    h, w = img.shape[:2]
    print(f"Original image dimensions: {w}x{h} (w x h)")

    # If height > width, it's portrait mode while ID cards (CIN) are landscape.
    # In portrait mode on smartphones, rotating 90 counter-clockwise brings the top of card to the top.
    if h > w * 1.05:
        print("Detected vertical/portrait image for landscape card. Testing rotations...")
        return cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
    
    return img

if __name__ == '__main__':
    print("Auto-orient helper ready.")
