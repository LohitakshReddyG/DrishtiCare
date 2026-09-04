"""
DrishtiCare - Phase 2: Retinal Image Quality Validation Module
OpenCV-based deterministic quality gatekeeper designed for rural frontline health workers.
Evaluates sharpness (Laplacian variance), illumination (brightness & contrast), and circular fundus framing.
"""

import cv2
import numpy as np
import os
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
from typing import Dict, Any, List, Tuple

class GatekeeperCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = models.mobilenet_v2(weights=None)
        self.backbone.classifier[1] = nn.Linear(self.backbone.classifier[1].in_features, 2)

    def forward(self, x):
        return self.backbone(x)

class ImageQualityChecker:
    def __init__(
        self,
        min_laplacian_var: float = 2.0,      # Blur threshold
        min_mean_brightness: float = 25.0,   # Underexposure threshold
        max_mean_brightness: float = 220.0,  # Overexposure threshold
        min_fov_fraction: float = 0.10,      # Retinal circle area ratio threshold
        max_center_offset_ratio: float = 0.45 # Distance from center tolerance
    ):
        self.min_laplacian_var = min_laplacian_var
        self.min_mean_brightness = min_mean_brightness
        self.max_mean_brightness = max_mean_brightness
        self.min_fov_fraction = min_fov_fraction
        self.max_center_offset_ratio = max_center_offset_ratio
        
        # Load the ML Gatekeeper
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.gatekeeper_model = GatekeeperCNN().to(self.device)
        self.model_loaded = False
        
        model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "fundus_gatekeeper.pt"))
        if os.path.exists(model_path):
            try:
                self.gatekeeper_model.load_state_dict(torch.load(model_path, map_location=self.device))
                self.gatekeeper_model.eval()
                self.model_loaded = True
            except Exception as e:
                print(f"[Quality] Failed to load gatekeeper: {e}")
                
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def evaluate(self, image_np: np.ndarray) -> Dict[str, Any]:
        """
        Evaluates a BGR or RGB NumPy image for clinical fundus quality.
        Returns structured diagnostic dictionary with plain-language recommendations.
        """
        if image_np is None or image_np.size == 0:
            return {
                "passed": False,
                "issues": ["corrupted_image"],
                "message": "The image file could not be read or is empty. Please capture or upload a new photo.",
                "laplacian_variance": 0.0,
                "mean_brightness": 0.0,
                "fov_fraction": 0.0,
                "centered": False,
                "recommendation": "Check camera connection or re-upload standard JPG/PNG image."
            }

        # 0. ML-based Fundus validation (OOD detection)
        if len(image_np.shape) == 3 and image_np.shape[2] == 3 and self.model_loaded:
            rgb_img = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
            try:
                with torch.no_grad():
                    tensor_img = self.transform(rgb_img).unsqueeze(0).to(self.device)
                    logits = self.gatekeeper_model(tensor_img)
                    probs = torch.softmax(logits, dim=1)[0]
                    # Class 1 = Fundus, Class 0 = OOD
                    if probs[1].item() < 0.5:
                        return {
                            "passed": False,
                            "issues": ["not_fundus"],
                            "message": "This doesn't appear to be a retinal image. Please upload a clear fundus photo.",
                            "recommendation": "The AI detected that this is not a valid retinal scan (e.g. screenshot, document, or unrelated photo).",
                            "laplacian_variance": 0.0,
                            "mean_brightness": 0.0,
                            "fov_fraction": 0.0,
                            "centered": False
                        }
            except Exception as e:
                print(f"[Quality] Gatekeeper inference error: {e}")

        # Convert to Grayscale for legacy quality checks
        if len(image_np.shape) == 3:
            gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY) if image_np.shape[2] == 3 else image_np[:, :, 0]
        else:
            gray = image_np

        h, w = gray.shape[:2]
        total_pixels = h * w

        # 1. Sharpness / Focus Analysis via Laplacian Variance
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        lap_var = float(laplacian.var())

        # 2. Brightness & Illumination Analysis
        _, tissue_mask = cv2.threshold(gray, 15, 255, cv2.THRESH_BINARY)
        tissue_pixel_count = cv2.countNonZero(tissue_mask)
        
        if tissue_pixel_count > 0:
            mean_brightness = float(cv2.mean(gray, mask=tissue_mask)[0])
        else:
            mean_brightness = float(np.mean(gray))

        # 3. Field of View & Retinal Disc Framing
        contours, _ = cv2.findContours(tissue_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        fov_fraction = 0.0
        centered = True
        offset_distance = 0.0

        if contours:
            largest_cnt = max(contours, key=cv2.contourArea)
            cnt_area = cv2.contourArea(largest_cnt)
            fov_fraction = float(cnt_area / total_pixels)

            M = cv2.moments(largest_cnt)
            if M["m00"] > 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
                center_x, center_y = w // 2, h // 2
                offset_distance = np.sqrt((cx - center_x) ** 2 + (cy - center_y) ** 2)
                max_allowed_offset = np.sqrt(center_x ** 2 + center_y ** 2) * self.max_center_offset_ratio
                if offset_distance > max_allowed_offset:
                    centered = False

        # Evaluate clinical quality issues
        issues: List[str] = []
        guidance_notes: List[str] = []

        if lap_var < self.min_laplacian_var:
            issues.append("blur")
            guidance_notes.append("Image is too blurry for reliable lesion detection. Hold the camera steady and refocus.")

        if mean_brightness < self.min_mean_brightness:
            issues.append("underexposed")
            guidance_notes.append("Image is too dark. Increase illumination or check pupil dilation.")
        elif mean_brightness > self.max_mean_brightness:
            issues.append("overexposed")
            guidance_notes.append("Image is washed out by glare. Adjust flash intensity or angle.")

        if fov_fraction < self.min_fov_fraction:
            issues.append("small_fov")
            guidance_notes.append("Retinal view is too small or distant. Bring the camera closer to the eye.")

        if not centered:
            issues.append("off_center")
            guidance_notes.append("Retina is off-center. Align the optic disc and macula inside the frame guide.")

        passed = (len(issues) == 0)

        if passed:
            message = "Image quality is clear and optimal for AI screening."
            recommendation = "Proceed to automated DR analysis."
        else:
            message = f"Image quality is insufficient due to {', '.join(issues)}. Please recapture."
            recommendation = " ".join(guidance_notes)

        return {
            "passed": passed,
            "issues": issues,
            "message": message,
            "recommendation": recommendation,
            "laplacian_variance": round(lap_var, 2),
            "mean_brightness": round(mean_brightness, 2),
            "fov_fraction": round(fov_fraction, 3),
            "centered": centered
        }

# Singleton instance for direct import
quality_checker = ImageQualityChecker()
