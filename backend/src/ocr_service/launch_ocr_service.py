# -*- coding: utf-8 -*-
"""
STB — Lanceur intelligent du microservice OCR avec vérification Ollama automatique.
  1. Vérifie si Ollama est actif (ollama serve)
  2. Vérifie si llama3.2-vision est disponible, le télécharge sinon
  3. Lance le FastAPI OCR sur le port 8000
"""

import os
import sys
import time
import subprocess
import urllib.request
import urllib.error
import json

if sys.platform.startswith('win'):
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2-vision")
OCR_PORT = int(os.environ.get("OCR_PORT", 8000))
OCR_HOST = os.environ.get("OCR_HOST", "127.0.0.1")

BANNER = """
╔══════════════════════════════════════════════════════════════════╗
║       STB Document Intelligence — OCR Hybride Démarrage         ║
║       Llama 3.2 Vision  +  EasyOCR Arabe  +  FastAPI            ║
╚══════════════════════════════════════════════════════════════════╝
"""


def print_step(step: str, status: str = "INFO"):
    icons = {"INFO": "ℹ️", "OK": "✅", "WARN": "⚠️", "ERR": "❌", "WAIT": "⏳"}
    icon = icons.get(status, "•")
    print(f"  {icon}  {step}", flush=True)


def is_ollama_running(host: str = OLLAMA_HOST, timeout: float = 2.0) -> bool:
    """Vérifie si le serveur Ollama répond."""
    for h in [host, host.replace("localhost", "127.0.0.1")]:
        try:
            with urllib.request.urlopen(f"{h.rstrip('/')}/api/tags", timeout=timeout) as r:
                if r.status == 200:
                    return True
        except Exception:
            continue
    return False


def get_available_models(host: str = OLLAMA_HOST) -> list:
    """Récupère la liste des modèles disponibles dans Ollama."""
    try:
        with urllib.request.urlopen(f"{host.rstrip('/')}/api/tags", timeout=3) as r:
            data = json.loads(r.read().decode())
            return [m.get("name", "") for m in data.get("models", [])]
    except Exception:
        return []


def pull_model(model: str = OLLAMA_MODEL):
    """Télécharge le modèle Llama Vision si absent."""
    print_step(f"Téléchargement du modèle '{model}' en cours (peut prendre quelques minutes)...", "WAIT")
    try:
        result = subprocess.run(
            ["ollama", "pull", model],
            capture_output=False,
            text=True,
            timeout=600  # 10 minutes max
        )
        if result.returncode == 0:
            print_step(f"Modèle '{model}' téléchargé avec succès.", "OK")
            return True
        else:
            print_step(f"Échec du téléchargement du modèle : {result.stderr}", "ERR")
            return False
    except FileNotFoundError:
        print_step("'ollama' introuvable dans le PATH. Assurez-vous qu'Ollama est installé.", "ERR")
        return False
    except subprocess.TimeoutExpired:
        print_step("Timeout dépassé lors du téléchargement du modèle.", "ERR")
        return False


def start_ollama_serve():
    """Tente de démarrer ollama serve en arrière-plan."""
    print_step("Démarrage de 'ollama serve' en arrière-plan...", "WAIT")
    try:
        if sys.platform.startswith("win"):
            subprocess.Popen(
                ["ollama", "serve"],
                creationflags=subprocess.CREATE_NEW_CONSOLE,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        else:
            subprocess.Popen(
                ["ollama", "serve"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        # Attendre que le serveur soit prêt (max 15s)
        for _ in range(15):
            time.sleep(1)
            if is_ollama_running():
                print_step("Ollama serve est maintenant actif.", "OK")
                return True
        print_step("Ollama ne répond pas après 15s. Vérifiez l'installation.", "WARN")
        return False
    except FileNotFoundError:
        print_step("'ollama' non trouvé dans le PATH.", "ERR")
        return False


def check_and_prepare_ollama():
    """Pipeline de vérification et préparation d'Ollama."""
    print("\n── Vérification Ollama ─────────────────────────────────────")

    # 1. Ollama est-il actif ?
    if is_ollama_running():
        print_step("Serveur Ollama actif et joignable.", "OK")
    else:
        print_step("Serveur Ollama non joignable. Tentative de démarrage...", "WARN")
        if not start_ollama_serve():
            print_step("Ollama indisponible. Le service OCR démarrera en mode EasyOCR uniquement.", "WARN")
            return False

    # 2. Le modèle llama3.2-vision est-il disponible ?
    models = get_available_models()
    model_present = any(OLLAMA_MODEL in m for m in models)

    if model_present:
        print_step(f"Modèle '{OLLAMA_MODEL}' disponible localement.", "OK")
    else:
        print_step(f"Modèle '{OLLAMA_MODEL}' absent. Lancement du téléchargement...", "WARN")
        if not pull_model(OLLAMA_MODEL):
            print_step("Démarrage sans Llama Vision (fallback EasyOCR automatique actif).", "WARN")
            return False

    return True


def launch_fastapi():
    """Lance le serveur FastAPI OCR."""
    print("\n── Démarrage FastAPI OCR ───────────────────────────────────")
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Ajouter les utils au PYTHONPATH
    utils_dir = os.path.abspath(os.path.join(script_dir, "..", "utils"))
    env = os.environ.copy()
    python_path = env.get("PYTHONPATH", "")
    env["PYTHONPATH"] = f"{script_dir}{os.pathsep}{utils_dir}{os.pathsep}{python_path}"
    env["PYTHONIOENCODING"] = "utf-8"

    print_step(f"Serveur OCR → http://{OCR_HOST}:{OCR_PORT}", "INFO")
    print_step(f"Documentation Swagger → http://{OCR_HOST}:{OCR_PORT}/docs", "INFO")
    print_step(f"Documentation ReDoc   → http://{OCR_HOST}:{OCR_PORT}/redoc", "INFO")
    print_step(f"Statut Ollama         → http://{OCR_HOST}:{OCR_PORT}/health", "INFO")
    print()

    try:
        import uvicorn
        # Changer le répertoire de travail vers le dossier du script
        os.chdir(script_dir)
        uvicorn.run(
            "main:app",
            host=OCR_HOST,
            port=OCR_PORT,
            reload=False,
            app_dir=script_dir,
            log_level="info"
        )
    except ImportError:
        # Fallback via subprocess si uvicorn n'est pas importable directement
        python_cmd = sys.executable
        subprocess.run(
            [python_cmd, "-m", "uvicorn", "main:app",
             "--host", OCR_HOST, "--port", str(OCR_PORT)],
            cwd=script_dir,
            env=env
        )


if __name__ == "__main__":
    print(BANNER)
    ollama_ok = check_and_prepare_ollama()

    if not ollama_ok:
        print("\n  ⚠️  Mode dégradé : Llama Vision désactivé, EasyOCR actif comme moteur principal.")

    print("\n── Configuration ───────────────────────────────────────────")
    print_step(f"Ollama Host  : {OLLAMA_HOST}", "INFO")
    print_step(f"Ollama Model : {OLLAMA_MODEL}", "INFO")
    print_step(f"LLAMA_ONLY   : {os.environ.get('LLAMA_ONLY', 'false')}", "INFO")

    launch_fastapi()
