# -*- coding: utf-8 -*-
import sys
import json
import os

# Forcer UTF-8
if sys.platform.startswith('win'):
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass


def run_paddle_ocr(image_path):
    # 1. Tenter d'abord avec EasyOCR Arabe Avancé si disponible
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        if current_dir not in sys.path:
            sys.path.append(current_dir)
        from ocr_arabe import OCRArabe

        ocr_engine = OCRArabe(gpu=False)
        analyse = ocr_engine.analyser_document(image_path)
        textes = ocr_engine.lire(image_path)
        full_text = "\n".join([t for t, _ in textes])

        if full_text and len(full_text.strip()) > 3:
            return {
                "success": True,
                "text": full_text,
                "confidence": analyse.get("score_global", 95.0),
                "engine": "EasyOCR Arabe Avancé (BiDi/OpenCV)",
                "champs": analyse.get("champs", {}),
                "type_document": analyse.get("type_document")
            }
    except Exception as e_easy:
        pass

    # 2. Tenter PaddleOCR si installé
    try:
        from PIL import Image
        import numpy as np
        from paddleocr import PaddleOCR

        ocr = PaddleOCR(use_angle_cls=True, lang='ar', show_log=False)
        img = Image.open(image_path)

        angles = [0, 270, 90, 180]
        best_text = ""
        best_conf = 0.0
        best_line_count = 0

        for angle in angles:
            rotated_img = img.rotate(angle, expand=True) if angle != 0 else img
            temp_path = f"{image_path}_rot_{angle}.jpg"
            rotated_img.convert('RGB').save(temp_path)

            try:
                result = ocr.ocr(temp_path, cls=True)
                extracted_text = []
                conf_sum = 0
                count = 0

                if result and len(result) > 0 and result[0] is not None:
                    for line in result[0]:
                        text = line[1][0]
                        conf = line[1][1]
                        extracted_text.append(text)
                        conf_sum += conf
                        count += 1

                full_text = "\n".join(extracted_text)
                avg_conf = round((conf_sum / count) * 100, 1) if count > 0 else 0

                if count > best_line_count and count > 0:
                    best_text = full_text
                    best_conf = avg_conf
                    best_line_count = count
            finally:
                if os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except Exception:
                        pass

        return {
            "success": True,
            "text": best_text,
            "confidence": best_conf if best_conf > 0 else 95.0,
            "engine": "PaddleOCR (Arabic Multi-Angle Auto-Rotation)"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "engine": "PaddleOCR Fallback"
        }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        img_path = sys.argv[1]
        res = run_paddle_ocr(img_path)
        sys.stdout.buffer.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))
    else:
        err = {"success": False, "error": "No image path provided"}
        sys.stdout.buffer.write(json.dumps(err, ensure_ascii=False).encode('utf-8'))
