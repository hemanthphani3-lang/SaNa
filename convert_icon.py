from PIL import Image
import os

def convert_png_to_ico(png_path, ico_path):
    img = Image.open(png_path)
    # Define standard icon sizes for Windows
    icon_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(ico_path, sizes=icon_sizes)
    print(f"Converted {png_path} to {ico_path}")

if __name__ == "__main__":
    png = "assets/icon.png"
    ico = "assets/icon.ico"
    if os.path.exists(png):
        convert_png_to_ico(png, ico)
    else:
        print(f"Error: {png} not found.")
