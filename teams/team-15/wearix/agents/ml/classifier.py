"""
Public API for the ML classifier.
Loaded once at module level — safe to import from pipeline.py.

Usage:
    from ml.classifier import classify
    result = classify("Where is my order?")
"""

import os
import pickle

# ── Maps (duplicated here so classifier.py is self-contained) ──────────────────
TIER_MAP = {
    "cancel_order": 1, "change_order": 1, "change_shipping_address": 1,
    "check_cancellation_fee": 1, "check_invoice": 1, "check_payment_methods": 1,
    "check_refund_policy": 1, "delivery_options": 1, "delivery_period": 1,
    "get_invoice": 1, "get_refund": 1, "newsletter_subscription": 1,
    "place_order": 1, "review": 1, "set_up_shipping_address": 1,
    "track_order": 1, "track_refund": 1, "create_account": 1,
    "edit_account": 1, "switch_account": 1, "recover_password": 1,
    "registration_problems": 1,
    "complaint": 2, "contact_customer_service": 2, "contact_human_agent": 2,
    "payment_issue": 2, "delete_account": 2,
}

DEPARTMENT_MAP = {
    "track_order": "Logistics", "delivery_period": "Logistics",
    "change_shipping_address": "Logistics", "set_up_shipping_address": "Logistics",
    "cancel_order": "Orders", "change_order": "Orders", "place_order": "Orders",
    "check_cancellation_fee": "Orders", "delivery_options": "Orders",
    "get_refund": "Returns", "check_refund_policy": "Returns", "track_refund": "Returns",
    "check_invoice": "Billing", "get_invoice": "Billing",
    "check_payment_methods": "Billing", "payment_issue": "Billing",
    "create_account": "Account", "edit_account": "Account", "delete_account": "Account",
    "switch_account": "Account", "recover_password": "Account",
    "registration_problems": "Account",
    "complaint": "Support", "contact_customer_service": "Support",
    "contact_human_agent": "Support",
    "newsletter_subscription": "General", "review": "General",
}

# ── Load model once ────────────────────────────────────────────────────────────
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "classifier.pkl")

def _load_model():
    if not os.path.exists(_MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {_MODEL_PATH}. "
            "Run `python -m ml.train` first to train and save the model."
        )
    with open(_MODEL_PATH, "rb") as f:
        return pickle.load(f)

_pipeline = _load_model()


# ── Public API ─────────────────────────────────────────────────────────────────
def classify(text: str) -> dict:
    """
    Classify a customer support message.

    Args:
        text: Raw customer message string.

    Returns:
        {
            "tier":       1 or 2,
            "intent":     "track_order",
            "department": "Logistics",
            "confidence": 0.943
        }
    """
    proba   = _pipeline.predict_proba([text])[0]
    intent  = _pipeline.classes_[proba.argmax()]
    confidence = float(proba.max())

    tier       = TIER_MAP.get(intent, 1)          # default Tier-1 if unknown
    department = DEPARTMENT_MAP.get(intent, "General")

    return {
        "tier":       tier,
        "intent":     intent,
        "department": department,
        "confidence": round(confidence, 4),
    }