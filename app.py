# app.py
from flask import Flask, request, jsonify, render_template
import re
import traceback
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

app = Flask(__name__)

MODEL_DIR = "best_phishing_model"

# FORCE CPU to avoid CUDA "no kernel image" errors
device = torch.device("cpu")

tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, use_fast=True)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR).to(device)
model.eval()

# Ensure labels exist
model.config.id2label = {0: "Safe", 1: "Not Safe"}
model.config.label2id = {"Safe": 0, "Not Safe": 1}


def normalize_url(url: str) -> str:
    url = (url or "").strip()
    if url and not re.match(r"^https?://", url, re.IGNORECASE):
        url = "http://" + url
    return url


@torch.no_grad()
def predict_one(url: str) -> dict:
    enc = tokenizer(url, return_tensors="pt", truncation=True)
    enc = {k: v.to(device) for k, v in enc.items()}

    logits = model(**enc).logits
    probs = torch.softmax(logits, dim=-1)[0]

    pred_id = int(torch.argmax(probs).item())
    label = model.config.id2label[pred_id]

    return {
        "url": url,
        "label": label,
        "confidence": round(float(probs[pred_id].item()), 4),
        "prob_safe": round(float(probs[0].item()), 4),
        "prob_not_safe": round(float(probs[1].item()), 4),
        "device": str(device),
    }


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "device": str(device)})


@app.post("/api/predict")
def api_predict():
    try:
        data = request.get_json(force=True) or {}
        url = normalize_url(data.get("url", ""))

        if not url:
            return jsonify({"error": "URL is empty"}), 400

        return jsonify(predict_one(url))

    except Exception as e:
        tb = traceback.format_exc()
        print("\n=== /api/predict ERROR ===\n", tb)
        return jsonify({"error": str(e), "traceback": tb}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
