# -*- coding: utf-8 -*-
"""
Lanceur du microservice FastAPI OCR STB avec rechargement automatique et options configurables.
"""
import os
import sys

if sys.platform.startswith('win'):
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("OCR_PORT", 8000))
    host = os.environ.get("OCR_HOST", "127.0.0.1")
    workers = int(os.environ.get("OCR_WORKERS", 1))

    print("=" * 60)
    print(f"[*] STB Document Intelligence OCR Service demarre sur http://{host}:{port}")
    print(f"[*] Documentation Swagger interactive : http://{host}:{port}/docs")
    print(f"[*] Documentation ReDoc : http://{host}:{port}/redoc")
    print("=" * 60)

    # Assurer que le dossier du script est dans sys.path pour uvicorn
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if script_dir not in sys.path:
        sys.path.insert(0, script_dir)

    uvicorn.run("main:app", host=host, port=port, reload=False, workers=workers, app_dir=script_dir)

