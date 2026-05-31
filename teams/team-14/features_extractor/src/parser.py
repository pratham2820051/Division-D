import os
import httpx
import time
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
_project_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=_project_root / ".env", override=True)


def parse_document(file_path: str) -> str:
    """
    Parses a PDF, DOCX, or TXT file.
    - For PDF/DOCX: uses LlamaParse REST API
    - For TXT: reads file directly (no external API needed)
    Returns extracted text as Markdown string.
    """
    file_path = Path(file_path)
    suffix = file_path.suffix.lower()

    # ─── TXT: read directly, no API needed ────────────────────────────────────
    if suffix == ".txt":
        print(f"[Parser] Reading TXT file directly: {file_path}")
        text = file_path.read_text(encoding="utf-8", errors="replace")
        print(f"[Parser] TXT read complete. {len(text)} chars.")
        return text

    # ─── PDF / DOCX: use LlamaParse REST API ──────────────────────────────────
    api_key = os.getenv("LLAMA_CLOUD_API_KEY")
    if not api_key:
        raise ValueError(
            "LLAMA_CLOUD_API_KEY environment variable is not set. "
            "Check your .env file in the project root."
        )

    base_url = "https://api.cloud.llamaindex.ai/api/parsing"
    headers = {"Authorization": f"Bearer {api_key}"}

    print(f"[LlamaParse] Uploading document: {file_path.name}")

    # Determine MIME type
    mime_map = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    mime_type = mime_map.get(suffix, "application/octet-stream")

    # Step 1: Upload the file
    try:
        with open(file_path, "rb") as f:
            upload_response = httpx.post(
                f"{base_url}/upload",
                headers=headers,
                files={"file": (file_path.name, f, mime_type)},
                timeout=120.0,
            )
    except httpx.TimeoutException:
        raise RuntimeError("LlamaParse upload timed out. Check your internet connection.")

    if upload_response.status_code not in (200, 201):
        raise RuntimeError(
            f"LlamaParse upload failed: HTTP {upload_response.status_code} - {upload_response.text[:300]}"
        )

    job_id = upload_response.json().get("id")
    if not job_id:
        raise RuntimeError(f"No job ID in LlamaParse response: {upload_response.json()}")

    print(f"[LlamaParse] Job ID: {job_id} - polling for completion...")

    # Step 2: Poll for result (max ~2 minutes)
    max_polls = 40
    for attempt in range(max_polls):
        time.sleep(3)
        try:
            status_resp = httpx.get(
                f"{base_url}/job/{job_id}",
                headers=headers,
                timeout=30.0,
            )
        except httpx.TimeoutException:
            print(f"[LlamaParse] Poll {attempt+1} timed out, retrying...")
            continue

        if status_resp.status_code != 200:
            raise RuntimeError(f"LlamaParse status check failed: {status_resp.text[:300]}")

        status_data = status_resp.json()
        status = status_data.get("status", "")
        print(f"[LlamaParse] Poll {attempt+1}/{max_polls}: status = {status}")

        if status == "SUCCESS":
            break
        elif status in ("ERROR", "FAILED", "CANCELLED"):
            raise RuntimeError(f"LlamaParse job failed with status: {status}. Details: {status_data}")
    else:
        raise RuntimeError("LlamaParse job timed out after 2 minutes.")

    # Step 3: Fetch markdown result
    print("[LlamaParse] Fetching markdown result...")
    result_resp = httpx.get(
        f"{base_url}/job/{job_id}/result/markdown",
        headers=headers,
        timeout=60.0,
    )

    if result_resp.status_code != 200:
        raise RuntimeError(f"LlamaParse result fetch failed: {result_resp.text[:300]}")

    result_data = result_resp.json()

    # Combine all pages
    pages = result_data.get("pages", [])
    if pages:
        extracted_text = "\n\n".join(page.get("md", "") for page in pages)
    else:
        # Fallback: try top-level markdown field
        extracted_text = result_data.get("markdown", "") or str(result_data)

    print(f"[LlamaParse] Extraction complete. {len(extracted_text)} chars from {len(pages)} page(s).")
    return extracted_text
