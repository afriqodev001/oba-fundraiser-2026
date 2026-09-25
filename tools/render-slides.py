"""Re-render the slide images from the Google Slides deck.

The site serves pre-rendered images in /slides (slide-001.jpg …) so the show never depends on Google
or the venue Wi-Fi. Run this whenever the deck changes.

    # 1. download the deck as PDF (deck must be link-viewable, or use File > Download > PDF in Slides)
    curl -L -o oba_deck.pdf \
      "https://docs.google.com/presentation/d/<DECK_ID>/export/pdf"
    # 2. render every slide to a 1920px-wide JPEG
    pip install pymupdf
    python tools/render-slides.py oba_deck.pdf

Deck ID for this event: 1M9IrRTCapkLlILKL-ldkJVjTF9oSVqfSAcCQgDmRS4k
"""
import sys, os, fitz

pdf = sys.argv[1] if len(sys.argv) > 1 else "oba_deck.pdf"
out = sys.argv[2] if len(sys.argv) > 2 else "slides"
width = 1920

doc = fitz.open(pdf)
os.makedirs(out, exist_ok=True)
mat = fitz.Matrix(width / doc[0].rect.width, width / doc[0].rect.width)
for i in range(doc.page_count):
    pix = doc[i].get_pixmap(matrix=mat, alpha=False)
    path = os.path.join(out, f"slide-{i + 1:03d}.jpg")
    try:
        pix.save(path, jpg_quality=82)
    except Exception:
        pix.save(path.replace(".jpg", ".png"))
print(f"rendered {doc.page_count} slides -> {out}/")
