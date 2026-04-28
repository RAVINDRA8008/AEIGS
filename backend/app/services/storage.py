import os
import uuid
from PIL import Image
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class StorageService:

    @staticmethod
    def save_original(image: Image.Image, filename: str) -> str:
        ext = os.path.splitext(filename)[1].lower() or ".png"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        path = os.path.join(settings.UPLOAD_DIR, "originals", unique_name)
        image.save(path)
        return path

    @staticmethod
    def save_scan(image: Image.Image, filename: str) -> str:
        ext = os.path.splitext(filename)[1].lower() or ".png"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        path = os.path.join(settings.UPLOAD_DIR, "scans", unique_name)
        image.save(path)
        return path

    @staticmethod
    def save_thumbnail(image: Image.Image, filename: str) -> str:
        unique_name = f"{uuid.uuid4().hex}_thumb.png"
        path = os.path.join(settings.UPLOAD_DIR, "thumbnails", unique_name)
        image.save(path, "PNG")
        return path

    @staticmethod
    def delete_file(path: str):
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception as e:
            logger.warning(f"Could not delete file {path}: {e}")

    @staticmethod
    def get_file_size(path: str) -> int:
        try:
            return os.path.getsize(path)
        except Exception:
            return 0

    @staticmethod
    def get_relative_path(absolute_path: str) -> str:
        if settings.UPLOAD_DIR in absolute_path:
            return absolute_path.replace(settings.UPLOAD_DIR, "/uploads").replace("\\", "/")
        return absolute_path.replace("\\", "/")
