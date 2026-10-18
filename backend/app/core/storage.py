"""
Phase 3 — media storage.

Two backends:
- "supabase": real Supabase Storage (used whenever SUPABASE_URL /
  SUPABASE_SERVICE_KEY are set in .env). Buckets should be PRIVATE —
  we never make video/audio public, since this can carry sensitive
  personal/medical content. We store only the object *path* in the
  database and mint a short-lived signed URL every time it's read.

  NOTE: we call the Supabase Storage REST API directly via httpx instead
  of the `supabase`/`storage3` Python client. That client has a known bug
  where its own error-handling path crashes with
  `'dict' object has no attribute 'text'`, which masks the real upstream
  error whenever an upload fails for any reason. Calling the REST API
  directly means real errors (bad bucket, bad key, permission issues)
  surface as-is instead of being swallowed by a broken client.
- "local": filesystem fallback for local development without a Supabase
  project configured yet. Files land in backend/local_storage/ and are
  served back through a static route mounted in main.py. Signed URLs are
  simulated as plain paths with an expiry query param (not cryptographically
  enforced — local mode is for dev only, never use it in production).

Callers should only ever use `upload_file` and `get_signed_url` — nothing
else in the app should know which backend is active.
"""
import os
import time
from pathlib import Path

import httpx

from app.config import settings

USE_SUPABASE = bool(settings.supabase_url and settings.supabase_service_key)

LOCAL_STORAGE_ROOT = Path(__file__).resolve().parent.parent.parent / "local_storage"

_SUPABASE_HEADERS = {
    "Authorization": f"Bearer {settings.supabase_service_key}",
    "apikey": settings.supabase_service_key,
}



def _ext_for_content_type(content_type: str) -> str:
    # Normalize MIME type, removing parameters like ;codecs=opus
    base_type = (content_type or "").split(";", 1)[0].strip().lower()

    mapping = {
        "video/mp4": ".mp4",
        "video/webm": ".webm",
        "video/quicktime": ".mov",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "audio/mpeg": ".mp3",
        "audio/mp4": ".m4a",
        "audio/x-m4a": ".m4a",
        "audio/wav": ".wav",
        "audio/x-wav": ".wav",
        "audio/webm": ".webm",
        "audio/ogg": ".ogg",
    }

    return mapping.get(base_type, "")



def build_object_path(user_id: str, message_id: str, content_type: str) -> str:
    # Strip codec params etc. (e.g. "audio/webm;codecs=opus") before lookup —
    # browsers routinely send these and an exact-match lookup would miss them.
    base_type = (content_type or "").split(";")[0].strip().lower()
    ext = _ext_for_content_type(base_type)
    return f"{user_id}/{message_id}{ext}"


def upload_file(bucket: str, path: str, content: bytes, content_type: str) -> str:
    """Uploads bytes to storage and returns the object path (NOT a URL)."""
    if USE_SUPABASE:
        url = f"{settings.supabase_url_clean}/storage/v1/object/{bucket}/{path}"
        resp = httpx.post(
            url,
            content=content,
            headers={
                **_SUPABASE_HEADERS,
                "Content-Type": content_type or "application/octet-stream",
                "x-upsert": "true",
            },
            timeout=30,
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(
                f"Supabase Storage upload failed ({resp.status_code}) "
                f"for bucket={bucket!r} path={path!r}: {resp.text}"
            )
        return path

    # Local fallback
    dest_dir = LOCAL_STORAGE_ROOT / bucket / os.path.dirname(path)
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_file = LOCAL_STORAGE_ROOT / bucket / path
    dest_file.write_bytes(content)
    return path


def get_signed_url(bucket: str, path: str | None, expires_in: int | None = None) -> str | None:
    """Returns a fresh, time-limited URL for a stored object, or None."""
    if not path:
        return None

    if USE_SUPABASE:
        url = f"{settings.supabase_url_clean}/storage/v1/object/sign/{bucket}/{path}"
        resp = httpx.post(
            url,
            json={"expiresIn": expires_in or settings.signed_url_expiry_seconds},
            headers={**_SUPABASE_HEADERS, "Content-Type": "application/json"},
            timeout=15,
        )
        if resp.status_code != 200:
            raise RuntimeError(
                f"Supabase signed URL generation failed ({resp.status_code}) "
                f"for bucket={bucket!r} path={path!r}: {resp.text}"
            )
        body = resp.json()
        signed_path = body.get("signedURL") or body.get("signedUrl")
        if not signed_path:
            raise RuntimeError(f"Unexpected signed URL response shape: {resp.text}")
        # signed_path looks like "/object/sign/<bucket>/<path>?token=..."
        return f"{settings.supabase_url_clean}/storage/v1{signed_path}"

    # Local fallback: served by the /local-media static mount in main.py.
    # Not a real signature — dev-only convenience.
    expires = int(time.time()) + (expires_in or settings.signed_url_expiry_seconds)
    return f"/local-media/{bucket}/{path}?exp={expires}"


def delete_file(bucket: str, path: str | None) -> None:
    if not path:
        return
    if USE_SUPABASE:
        url = f"{settings.supabase_url_clean}/storage/v1/object/{bucket}/{path}"
        resp = httpx.delete(url, headers=_SUPABASE_HEADERS, timeout=15)
        if resp.status_code not in (200, 204):
            # Don't crash the caller (e.g. message deletion) over a missing
            # file — just log it. A 404 here is common and harmless (e.g.
            # deleting a message that never had media attached).
            print(f"Supabase Storage delete warning ({resp.status_code}): {resp.text}")
        return
    f = LOCAL_STORAGE_ROOT / bucket / path
    if f.exists():
        f.unlink()
