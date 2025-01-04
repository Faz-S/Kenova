import os
from dotenv import load_dotenv

load_dotenv()

class FileHandler:
    VIDEO_EXTENSIONS = {"mp4", "mkv", "avi", "mov", "mpg", "mpeg", "x-flv", "webm", "wmv", "3gpp"}
    TEXT_EXTENSIONS = {"pdf", "txt", "docx", "html", "csv", "xml", "md", "rtf", "css"}
    IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "heic", "heif"}

    @staticmethod
    def get_file_extension(file_path):
        return file_path.split('.')[-1].lower()

    def determine_file_type(self, file_path):
        extension = self.get_file_extension(file_path)
        if extension in self.VIDEO_EXTENSIONS:
            return "video"
        elif extension in self.TEXT_EXTENSIONS:
            return "text"
        elif extension in self.IMAGE_EXTENSIONS:
            return "image"
        else:
            return None

    @staticmethod
    def check_file_exists(file_path):
        if not os.path.exists(file_path):
            print("Error: File not found. Please check the path and try again.")
            return False
        return True
