import os
import pickle

# Global Configuration
DEMO_MODE = False  # Try real mode first

# Try importing torch - if it fails, fall back to demo mode
try:
    import torch
    from torchvision import models, transforms
    import torch.nn as nn
    from PIL import Image
    TORCH_AVAILABLE = True
except ImportError:
    print("WARNING: PyTorch not installed. DL model will run in demo mode.")
    TORCH_AVAILABLE = False

class ModelLoader:
    def __init__(self):
        self.xgb_model = None
        self.image_model = None
        self.is_demo = False
        self.warning_msg = None
        self.classes = ['Normal', 'Osteopenia', 'Osteoporosis']
        
        if not TORCH_AVAILABLE:
            self.is_demo = True
            self.warning_msg = "PyTorch not installed. Running in synthetic inference mode."
            self.device = None
            self.transform = None
            print(self.warning_msg)
            return

        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        
        # Define image transforms
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

        if not DEMO_MODE:
            self._load_clinical_model()
            self._load_image_model()
            
        if self.xgb_model is None or self.image_model is None:
            self.is_demo = True
            self.warning_msg = "Real models missing. Auto-switched to synthetic inference mode."

    def _load_clinical_model(self):
        xgb_path = os.path.join(os.path.dirname(__file__), "../models/clinical/xgboost_baseline.pkl")
        if os.path.exists(xgb_path):
            with open(xgb_path, 'rb') as f:
                self.xgb_model = pickle.load(f)
            print("Loaded XGBoost clinical model.")
        else:
            print(f"Warning: {xgb_path} not found.")

    def _load_image_model(self):
        # Pointing to your actual final model for the local presentation
        img_path = os.path.join(os.path.dirname(__file__), "../models/densenet121_best.pth")
        if os.path.exists(img_path):
            self.image_model = models.densenet121()
            num_ftrs = self.image_model.classifier.in_features
            self.image_model.classifier = nn.Sequential(
                nn.Dropout(0.5),
                nn.Linear(num_ftrs, 256),
                nn.ReLU(),
                nn.Dropout(0.5),
                nn.Linear(256, 3)
            )
            self.image_model.load_state_dict(torch.load(img_path, map_location=self.device))
            self.image_model = self.image_model.to(self.device)
            self.image_model.eval()
            print("Successfully Loaded your FINAL DenseNet121 model locally.")
        else:
            print(f"CRITICAL WARNING: Model file not found at {img_path}")
            self.image_model = None

    def predict_risk(self, features):
        if self.is_demo:
            return 0.82
            
        import pandas as pd
        df = pd.DataFrame([features])
        return float(self.xgb_model.predict_proba(df)[0][1])

    def predict_image(self, image_path):
        if self.is_demo:
            return "Osteopenia", [0.1, 0.7, 0.2]
            
        image = Image.open(image_path).convert('RGB')
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            outputs = self.image_model(input_tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)[0].cpu().numpy().tolist()
            _, preds = torch.max(outputs, 1)
            return self.classes[preds[0].item()], probs

    def predict_fusion(self, clinical_score, image_prediction):
        if self.is_demo:
            return "Osteoporosis"
            
        # Mathematically justified Late Fusion (Weighted Average)
        # clinical_score is prob [0, 1]
        img_severity = self.classes.index(image_prediction)
        img_score = img_severity / 2.0  # map 0,1,2 -> 0.0, 0.5, 1.0
        
        # final_score = 0.6 * clinical_score + 0.4 * image_score
        final_score = (0.6 * clinical_score) + (0.4 * img_score)
        
        if final_score > 0.65:
            return "Osteoporosis"
        elif final_score > 0.35:
            return "Osteopenia"
        return "Normal"

# Eager loading instance
ai_system = ModelLoader()
