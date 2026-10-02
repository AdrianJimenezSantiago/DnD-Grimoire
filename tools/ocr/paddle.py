# OCR de una imagen con PaddleOCR (PP-OCRv4 en ONNX, vía rapidocr_onnxruntime) → JSON con una caja y un texto por línea.
#   python3 tools/ocr/paddle.py pagina.png salida.json
import json, sys
from rapidocr_onnxruntime import RapidOCR

res, _ = RapidOCR()(sys.argv[1])
json.dump([{'caja': [[float(x), float(y)] for x, y in r[0]], 'texto': r[1], 'conf': float(r[2])} for r in (res or [])],
          open(sys.argv[2], 'w'), ensure_ascii=False)
