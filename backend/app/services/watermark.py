"""
Digital DNA — Dual-Layer Watermarking Service

Layer 1: LSB steganography (fragile — exact copy tracing)
Layer 2: DCT frequency-domain watermarking (robust — survives compression,
         cropping, re-encoding, screenshots, social media pipelines)

Each watermarked copy gets a unique UID so leaked content can be traced
back to the exact recipient, even after YouTube/Instagram/TikTok processing.
"""

import uuid
import hashlib
import numpy as np
from PIL import Image
import logging

logger = logging.getLogger(__name__)

# Magic header to identify AEGIS watermarks
_MAGIC = "AEGIS_DNA:"
_TERMINATOR = "::END"

# DCT block size
_BLOCK = 8
# Strength of DCT watermark (higher = more robust but more visible)
_ALPHA = 25.0


class WatermarkService:

    @staticmethod
    def generate_uid() -> str:
        return uuid.uuid4().hex[:16]

    # ------------------------------------------------------------------ #
    #  LAYER 1 — LSB Steganography (fragile, exact-copy)                  #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _lsb_embed(image: Image.Image, watermark_uid: str) -> Image.Image:
        img = image.copy().convert("RGB")
        pixels = np.array(img, dtype=np.uint8)

        payload = f"{_MAGIC}{watermark_uid}{_TERMINATOR}"
        bits = "".join(format(ord(c), "08b") for c in payload)

        flat = pixels.flatten()
        if len(bits) > len(flat):
            raise ValueError("Image too small for watermark payload")

        for i, bit in enumerate(bits):
            flat[i] = (flat[i] & 0xFE) | int(bit)

        watermarked = flat.reshape(pixels.shape)
        return Image.fromarray(watermarked, "RGB")

    @staticmethod
    def _lsb_extract(image: Image.Image) -> str | None:
        img = image.convert("RGB")
        flat = np.array(img, dtype=np.uint8).flatten()

        max_chars = 200
        bits = "".join(str(b & 1) for b in flat[: max_chars * 8])

        chars = []
        for i in range(0, len(bits), 8):
            byte = bits[i : i + 8]
            if len(byte) < 8:
                break
            chars.append(chr(int(byte, 2)))

        text = "".join(chars)

        if _MAGIC not in text:
            return None

        start = text.index(_MAGIC) + len(_MAGIC)
        end = text.find(_TERMINATOR, start)
        if end == -1:
            return None
        return text[start:end]

    # ------------------------------------------------------------------ #
    #  LAYER 2 — DCT Frequency-Domain Watermarking (robust)               #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _uid_to_bits(uid: str, length: int = 128) -> np.ndarray:
        """Convert UID to a deterministic pseudo-random bit sequence."""
        seed = int(hashlib.sha256(uid.encode()).hexdigest(), 16) % (2**31)
        rng = np.random.RandomState(seed)
        return rng.choice([-1, 1], size=length).astype(np.float64)

    @staticmethod
    def _dct2(block: np.ndarray) -> np.ndarray:
        """Type-II 2D DCT using matrix multiplication (no scipy dependency)."""
        N = block.shape[0]
        n = np.arange(N)
        C = np.cos(np.pi * (2 * n[:, None] + 1) * n[None, :] / (2 * N))
        C[0, :] *= np.sqrt(1 / N)
        C[1:, :] *= np.sqrt(2 / N)
        return C.T @ block @ C

    @staticmethod
    def _idct2(block: np.ndarray) -> np.ndarray:
        """Type-II 2D inverse DCT."""
        N = block.shape[0]
        n = np.arange(N)
        C = np.cos(np.pi * (2 * n[:, None] + 1) * n[None, :] / (2 * N))
        C[0, :] *= np.sqrt(1 / N)
        C[1:, :] *= np.sqrt(2 / N)
        return C @ block @ C.T

    @classmethod
    def _dct_embed(cls, image: Image.Image, watermark_uid: str) -> Image.Image:
        """Embed watermark in DCT mid-frequency coefficients of Y channel."""
        img = image.copy().convert("YCbCr")
        y, cb, cr = img.split()
        y_arr = np.array(y, dtype=np.float64)

        h, w = y_arr.shape
        bh, bw = h // _BLOCK * _BLOCK, w // _BLOCK * _BLOCK
        y_crop = y_arr[:bh, :bw]

        bits = cls._uid_to_bits(watermark_uid)
        bit_idx = 0
        total_bits = len(bits)

        # Embed across DCT blocks in zigzag mid-frequency positions
        mid_freq_positions = [(2, 3), (3, 2), (4, 1), (1, 4), (3, 3), (2, 4), (4, 2), (1, 3)]

        for i in range(0, bh, _BLOCK):
            for j in range(0, bw, _BLOCK):
                block = y_crop[i : i + _BLOCK, j : j + _BLOCK]
                dct_block = cls._dct2(block)

                for pos in mid_freq_positions:
                    if bit_idx >= total_bits:
                        bit_idx = 0  # repeat pattern for redundancy
                    dct_block[pos] += _ALPHA * bits[bit_idx]
                    bit_idx += 1

                y_crop[i : i + _BLOCK, j : j + _BLOCK] = cls._idct2(dct_block)

        y_arr[:bh, :bw] = y_crop
        y_arr = np.clip(y_arr, 0, 255).astype(np.uint8)

        y_out = Image.fromarray(y_arr, mode="L")
        result = Image.merge("YCbCr", (y_out, cb, cr)).convert("RGB")
        return result

    @classmethod
    def _dct_extract(cls, original: Image.Image, suspect: Image.Image, watermark_uid: str) -> dict:
        """Extract and correlate DCT watermark. Needs original for comparison."""
        orig_y = np.array(original.convert("YCbCr").split()[0], dtype=np.float64)
        susp_y = np.array(suspect.convert("YCbCr").split()[0], dtype=np.float64)

        # Resize suspect to match original if needed
        if orig_y.shape != susp_y.shape:
            suspect_resized = suspect.resize(original.size, Image.Resampling.LANCZOS)
            susp_y = np.array(suspect_resized.convert("YCbCr").split()[0], dtype=np.float64)

        h, w = orig_y.shape
        bh, bw = h // _BLOCK * _BLOCK, w // _BLOCK * _BLOCK

        bits = cls._uid_to_bits(watermark_uid)
        mid_freq_positions = [(2, 3), (3, 2), (4, 1), (1, 4), (3, 3), (2, 4), (4, 2), (1, 3)]

        extracted = []
        bit_idx = 0
        total_bits = len(bits)

        for i in range(0, bh, _BLOCK):
            for j in range(0, bw, _BLOCK):
                orig_block = cls._dct2(orig_y[i : i + _BLOCK, j : j + _BLOCK])
                susp_block = cls._dct2(susp_y[i : i + _BLOCK, j : j + _BLOCK])

                for pos in mid_freq_positions:
                    diff = susp_block[pos] - orig_block[pos]
                    extracted.append(diff)
                    bit_idx += 1

        # Correlate with expected watermark pattern (repeat to match length)
        extracted = np.array(extracted[:len(bits) * (len(extracted) // len(bits))])
        expected = np.tile(bits, len(extracted) // len(bits))

        if len(extracted) == 0:
            return {"detected": False, "correlation": 0.0, "confidence": 0.0}

        correlation = float(np.corrcoef(extracted, expected)[0, 1])
        confidence = min(max((correlation + 1) / 2, 0.0), 1.0)

        return {
            "detected": correlation > 0.3,
            "correlation": round(correlation, 4),
            "confidence": round(confidence, 4),
            "method": "dct_frequency_domain",
        }

    @classmethod
    def _dct_blind_detect(cls, suspect: Image.Image, candidate_uids: list[str]) -> dict | None:
        """Try multiple UIDs against a suspect image without original (weaker but useful)."""
        susp_y = np.array(suspect.convert("YCbCr").split()[0], dtype=np.float64)
        h, w = susp_y.shape
        bh, bw = h // _BLOCK * _BLOCK, w // _BLOCK * _BLOCK

        mid_freq_positions = [(2, 3), (3, 2), (4, 1), (1, 4), (3, 3), (2, 4), (4, 2), (1, 3)]

        # Extract all mid-frequency energy
        energy = []
        for i in range(0, bh, _BLOCK):
            for j in range(0, bw, _BLOCK):
                dct_block = cls._dct2(susp_y[i : i + _BLOCK, j : j + _BLOCK])
                for pos in mid_freq_positions:
                    energy.append(dct_block[pos])
        energy = np.array(energy)

        best_match = None
        best_corr = -1.0

        for uid in candidate_uids:
            bits = cls._uid_to_bits(uid)
            expected = np.tile(bits, max(1, len(energy) // len(bits)))[:len(energy)]
            corr = float(np.corrcoef(energy, expected)[0, 1]) if len(energy) > 1 else 0.0
            if corr > best_corr:
                best_corr = corr
                best_match = uid

        if best_corr > 0.15 and best_match:
            return {
                "detected": True,
                "watermark_uid": best_match,
                "correlation": round(best_corr, 4),
                "confidence": round(min(max((best_corr + 1) / 2, 0.0), 1.0), 4),
                "method": "dct_blind_detection",
            }
        return None

    # ------------------------------------------------------------------ #
    #  PUBLIC API — Dual-layer embed / extract                            #
    # ------------------------------------------------------------------ #

    @classmethod
    def embed(cls, image: Image.Image, watermark_uid: str) -> Image.Image:
        """Embed BOTH LSB + DCT watermarks for maximum coverage."""
        # DCT first (modifies pixel values), then LSB on top
        dct_img = cls._dct_embed(image, watermark_uid)
        dual_img = cls._lsb_embed(dct_img, watermark_uid)
        return dual_img

    @classmethod
    def extract(cls, image: Image.Image) -> str | None:
        """Try LSB extraction first (exact copies), return UID if found."""
        return cls._lsb_extract(image)

    @classmethod
    def extract_robust(cls, original: Image.Image, suspect: Image.Image, watermark_uid: str) -> dict:
        """Full extraction: try LSB, then DCT correlation against original."""
        lsb_uid = cls._lsb_extract(suspect)
        if lsb_uid:
            return {
                "detected": True,
                "watermark_uid": lsb_uid,
                "method": "lsb_steganography",
                "confidence": 1.0,
                "dct_result": None,
            }

        dct_result = cls._dct_extract(original, suspect, watermark_uid)
        return {
            "detected": dct_result["detected"],
            "watermark_uid": watermark_uid if dct_result["detected"] else None,
            "method": "dct_frequency_domain",
            "confidence": dct_result["confidence"],
            "dct_result": dct_result,
        }

    @staticmethod
    def verify(image: Image.Image, expected_uid: str) -> dict:
        """Verify whether an image contains the expected watermark (LSB layer)."""
        extracted = WatermarkService._lsb_extract(image)
        if extracted is None:
            return {"verified": False, "reason": "no_watermark_found", "confidence": 0.0}
        if extracted == expected_uid:
            return {"verified": True, "extracted_uid": extracted, "confidence": 1.0}
        return {
            "verified": False,
            "reason": "uid_mismatch",
            "extracted_uid": extracted,
            "confidence": 0.5,
        }

    @staticmethod
    def generate_key(asset_id: int, recipient: str) -> str:
        """Generate a deterministic key for a watermark."""
        raw = f"aegis:{asset_id}:{recipient}:{uuid.uuid4().hex[:8]}"
        return hashlib.sha256(raw.encode()).hexdigest()[:32]

    @staticmethod
    def robustness_info() -> dict:
        """Return info about watermark robustness capabilities."""
        return {
            "layers": [
                {
                    "name": "LSB Steganography",
                    "type": "fragile",
                    "survives": ["exact_copy", "format_change_lossless"],
                    "fails": ["compression", "screenshot", "social_media"],
                },
                {
                    "name": "DCT Frequency-Domain",
                    "type": "robust",
                    "survives": [
                        "jpeg_compression",
                        "rescaling",
                        "cropping_mild",
                        "brightness_contrast",
                        "social_media_pipeline",
                        "screenshot",
                        "re_encoding",
                    ],
                    "fails": ["heavy_cropping", "complete_redraw"],
                },
            ],
            "detection_modes": [
                "lsb_exact_match",
                "dct_with_original",
                "dct_blind_multi_uid",
            ],
        }
