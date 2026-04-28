import google.generativeai as genai
from PIL import Image
import logging
import json

from app.config import settings

logger = logging.getLogger(__name__)


class GoogleAIService:
    _model = None
    _vision_model = None
    _initialized = False

    @classmethod
    def initialize(cls):
        if not settings.GOOGLE_API_KEY:
            logger.warning("GOOGLE_API_KEY not set — Google AI features disabled")
            return
        try:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            cls._model = genai.GenerativeModel("gemini-2.0-flash")
            cls._vision_model = genai.GenerativeModel("gemini-2.0-flash")
            cls._initialized = True
            logger.info("Google AI Service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Google AI: {e}")

    @classmethod
    def analyze_image(cls, image: Image.Image) -> dict:
        if not cls._initialized:
            return cls._fallback_analysis()

        try:
            prompt = """Analyze this image as a digital asset protection system. Provide:
1. A detailed description of the content
2. Whether this appears to be sports-related media (yes/no)
3. The type of content (photo, graphic, logo, screenshot, meme, etc.)
4. Key visual elements and identifiable features
5. Any visible watermarks, logos, or branding
6. Estimated originality (original content vs derivative/modified)

Respond in this exact JSON format:
{
    "description": "detailed description",
    "is_sports_content": true/false,
    "content_type": "type",
    "key_features": ["feature1", "feature2"],
    "labels": ["label1", "label2", "label3"],
    "watermarks_detected": ["watermark1"],
    "originality_score": 0.0 to 1.0,
    "analysis_notes": "any additional notes"
}"""

            response = cls._vision_model.generate_content([prompt, image])
            text = response.text.strip()

            # Extract JSON from response
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()

            result = json.loads(text)
            return result

        except Exception as e:
            logger.error(f"Gemini image analysis failed: {e}")
            return cls._fallback_analysis()

    @classmethod
    def compare_images(cls, image1: Image.Image, image2: Image.Image) -> dict:
        if not cls._initialized:
            return {"similarity_assessment": "unknown", "confidence": 0.0, "details": "AI service unavailable"}

        try:
            prompt = """You are a digital asset protection system. Compare these two images carefully.

Determine:
1. Are these the same or derived from the same original content?
2. What modifications have been made (cropping, color changes, overlays, watermarks, compression)?
3. Confidence level that these are related (0.0 to 1.0)
4. Whether this constitutes potential content misappropriation

Respond in this exact JSON format:
{
    "are_related": true/false,
    "similarity_assessment": "identical/near-duplicate/derivative/modified/unrelated",
    "confidence": 0.0 to 1.0,
    "modifications_detected": ["mod1", "mod2"],
    "misappropriation_risk": "high/medium/low/none",
    "details": "explanation"
}"""

            response = cls._vision_model.generate_content([prompt, image1, image2])
            text = response.text.strip()

            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()

            return json.loads(text)

        except Exception as e:
            logger.error(f"Gemini comparison failed: {e}")
            return {"similarity_assessment": "error", "confidence": 0.0, "details": str(e)}

    @classmethod
    def generate_description(cls, image: Image.Image) -> str:
        if not cls._initialized:
            return "AI description unavailable — API key not configured"

        try:
            prompt = "Describe this sports media image in 2-3 sentences, focusing on identifying features that would help detect unauthorized copies."
            response = cls._vision_model.generate_content([prompt, image])
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini description failed: {e}")
            return "Description generation failed"

    @classmethod
    def detect_web_presence(cls, image: Image.Image) -> list[dict]:
        """Simulate web presence detection using Gemini analysis."""
        if not cls._initialized:
            return []

        try:
            prompt = """Analyze this image and suggest what platforms and contexts this type of sports media
content would typically be shared on. List potential platforms where unauthorized copies might appear.

Respond in JSON format:
{
    "likely_platforms": ["platform1", "platform2"],
    "content_category": "category",
    "viral_potential": "high/medium/low",
    "protection_priority": "critical/high/medium/low"
}"""
            response = cls._vision_model.generate_content([prompt, image])
            text = response.text.strip()

            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()

            return json.loads(text)
        except Exception as e:
            logger.error(f"Web presence detection failed: {e}")
            return {}

    @staticmethod
    def _fallback_analysis() -> dict:
        return {
            "description": "AI analysis unavailable — configure GOOGLE_API_KEY",
            "is_sports_content": False,
            "content_type": "unknown",
            "key_features": [],
            "labels": [],
            "watermarks_detected": [],
            "originality_score": 0.0,
            "analysis_notes": "Fallback: Google AI not configured",
        }
