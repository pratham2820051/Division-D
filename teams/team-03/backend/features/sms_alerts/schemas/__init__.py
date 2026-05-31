"""SMS alert schemas."""

from features.sms_alerts.schemas.alert import AlertDraft, MAX_ALERT_MESSAGE_LENGTH

__all__ = ["AlertDraft", "MAX_ALERT_MESSAGE_LENGTH"]
