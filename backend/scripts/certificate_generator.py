#!/usr/bin/env python3
"""High-resolution student certificate generator for BlueSPACE Fintech Academy.

Produces a vector PDF (A3 portrait, 300 DPI equivalent) with a formal,
balanced layout: navy + gold color scheme, serif typography, decorative
double border with corner ornaments, institutional seal, and dedicated,
clearly legible fields for student name, course title, date, and instructor
signature.
"""

import argparse
import os
from datetime import date
from reportlab.lib.pagesizes import A3
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth

WIDTH, HEIGHT = A3  # 841.89 x 1190.55 pt  (~297 x 420 mm)

# ---------------------------------------------------------------- palette ---
NAVY = HexColor("#16233B")        # deep formal navy
NAVY_SOFT = HexColor("#2B3A5F")   # softer navy for secondary text
GOLD = HexColor("#C5A059")        # muted gold accent
GOLD_PALE = HexColor("#E8DCC8")   # pale gold for borders/seal
INK = HexColor("#242424")         # near-black body text
CREAM = HexColor("#FAF7F0")       # off-white page ground
SEAL = HexColor("#B98A3F")

# ------------------------------------------------------------- geometry -----
MARGIN = 72            # outer page margin (1 inch)
BORDER_INSET = 54      # inset of the inner decorative frame (0.75 in)
LOGO_TOP_Y = HEIGHT - 150

# ---------------------------------------------------------------- drawing ---


def _draw_corner_ornament(c, x, y, corner):
    """Draw a single symmetrical corner flourish."""
    c.saveState()
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.6)
    c.setFillColor(white)
    size = 46

    if corner == "tl":
        c.translate(x, y)
        c.arc(0, 0, size, 90, 180)            # outer quarter arc
        c.arc(8, 8, size - 8, 90, 180)        # inner quarter arc
        c.circle(0, 0, 5, stroke=1, fill=1)   # corner pivot dot
        p = c.beginPath()
        p.moveTo(0, size)
        p.curveTo(size * 0.55, size * 1.42, size, size * 0.55, size, size * 0.55)  # outer flourish
        p.moveTo(6, size - 6)
        p.curveTo(size * 0.5, size * 1.32, size - 6, 6, size - 6, 6)           # inner flourish
        c.drawPath(p, stroke=1, fill=0)
    elif corner == "tr":
        c.translate(x, y)
        c.scale(-1, 1)
        c.arc(0, 0, size, 90, 180)
        c.arc(8, 8, size - 8, 90, 180)
        c.circle(0, 0, 5, stroke=1, fill=1)
        p = c.beginPath()
        p.moveTo(0, size)
        p.curveTo(size * 0.55, size * 1.42, size, size * 0.55, size, size * 0.55)
        p.moveTo(6, size - 6)
        p.curveTo(size * 0.5, size * 1.32, size - 6, 6, size - 6, 6)
        c.drawPath(p, stroke=1, fill=0)
    elif corner == "bl":
        c.translate(x, y)
        c.scale(1, -1)
        c.arc(0, 0, size, 90, 180)
        c.arc(8, 8, size - 8, 90, 180)
        c.circle(0, 0, 5, stroke=1, fill=1)
        p = c.beginPath()
        p.moveTo(0, size)
        p.curveTo(size * 0.55, size * 1.42, size, size * 0.55, size, size * 0.55)
        p.moveTo(6, size - 6)
        p.curveTo(size * 0.5, size * 1.32, size - 6, 6, size - 6, 6)
        c.drawPath(p, stroke=1, fill=0)
    elif corner == "br":
        c.translate(x, y)
        c.scale(-1, -1)
        c.arc(0, 0, size, 90, 180)
        c.arc(8, 8, size - 8, 90, 180)
        c.circle(0, 0, 5, stroke=1, fill=1)
        p = c.beginPath()
        p.moveTo(0, size)
        p.curveTo(size * 0.55, size * 1.42, size, size * 0.55, size, size * 0.55)
        p.moveTo(6, size - 6)
        p.curveTo(size * 0.5, size * 1.32, size - 6, 6, size - 6, 6)
        c.drawPath(p, stroke=1, fill=0)

    c.restoreState()


def draw_frame(c):
    """Outer double border with gold corner ornaments."""
    c.saveState()

    # Outer hairline border
    c.setStrokeColor(GOLD_PALE)
    c.setLineWidth(0.7)
    c.rect(MARGIN, MARGIN, WIDTH - 2 * MARGIN, HEIGHT - 2 * MARGIN, stroke=1, fill=0)

    # Main decorative frame
    c.setStrokeColor(GOLD)
    c.setLineWidth(2.2)
    inner_x = BORDER_INSET
    inner_y = BORDER_INSET
    inner_w = WIDTH - 2 * BORDER_INSET
    inner_h = HEIGHT - 2 * BORDER_INSET
    c.rect(inner_x, inner_y, inner_w, inner_h, stroke=1, fill=0)

    # Secondary inner hairline for layering
    c.setStrokeColor(GOLD_PALE)
    c.setLineWidth(0.6)
    c.rect(inner_x + 10, inner_y + 10, inner_w - 20, inner_h - 20, stroke=1, fill=0)

    # Corner ornaments on the main frame
    _draw_corner_ornament(c, inner_x, inner_y + inner_h, "tl")
    _draw_corner_ornament(c, inner_x + inner_w, inner_y + inner_h, "tr")
    _draw_corner_ornament(c, inner_x, inner_y, "bl")
    _draw_corner_ornament(c, inner_x + inner_w, inner_y, "br")

    c.restoreState()


def draw_seal(c, cx, cy, radius=78):
    """Subtle embossed-style circular seal behind the body text."""
    c.saveState()
    c.setStrokeColor(SEAL)
    c.setLineWidth(1.4)
    c.setFillColor(HexColor("#F5EFE0"))
    c.circle(cx, cy, radius, stroke=1, fill=1)
    c.setStrokeColor(SEAL)
    c.setLineWidth(0.9)
    c.circle(cx, cy, radius - 10, stroke=1, fill=0)
    c.circle(cx, cy, radius - 20, stroke=1, fill=0)
    c.setFillColor(NAVY)
    c.setFont("Times-Roman", 9)
    c.drawCentredString(cx, cy + 4, "BLUESPACE")
    c.drawCentredString(cx, cy - 10, "FINTECH ACADEMY")
    c.setFont("Times-Italic", 7.5)
    c.drawCentredString(cx, cy - 19, "Est. 2024  |  Lagos, Nigeria")
    c.restoreState()


def _wrap(text, font, font_size, max_width):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if stringWidth(trial, font, font_size) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def generate_certificate(student_name, course_title, date_issued, instructor_name,
                         output_path, logo_path=None):
    c = canvas.Canvas(output_path, pagesize=A3)
    c.setTitle(f"Certificate of Completion - {student_name}")
    c.setAuthor("BlueSPACE Fintech Academy")
    c.setSubject("Student Certificate of Completion")

    # Page ground
    c.setFillColor(CREAM)
    c.rect(0, 0, WIDTH, HEIGHT, stroke=0, fill=1)

    draw_frame(c)
    draw_seal(c, WIDTH / 2.0, 150, radius=52)

    cx = WIDTH / 2.0

    # ---- Institution logo ------------------------------------------------
    if logo_path:
        try:
            img = ImageReader(logo_path)
            iw, ih = img.getSize()
            aspect = ih / iw
            logo_w = 300
            logo_h = logo_w * aspect
            c.drawImage(img, cx - logo_w / 2, LOGO_TOP_Y - logo_h, logo_w, logo_h,
                        mask="auto")
        except Exception:
            pass

    # ---- Institution name ------------------------------------------------
    c.setFillColor(NAVY)
    c.setFont("Times-Bold", 25)
    c.drawCentredString(cx, LOGO_TOP_Y - 10, "BLUESPACE FINTECH ACADEMY")

    c.setFillColor(GOLD)
    c.setFont("Times-Italic", 11)
    c.drawCentredString(cx, LOGO_TOP_Y - 26, "Professional Training  |  Industry-Aligned Certification")

    # Gold rule under header
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.4)
    rule_w = 220
    c.line(cx - rule_w / 2, LOGO_TOP_Y - 44, cx + rule_w / 2, LOGO_TOP_Y - 44)

    # ---- Certificate title ----------------------------------------------
    c.setFillColor(NAVY)
    c.setFont("Times-Bold", 40)
    c.drawCentredString(cx, HEIGHT - 430, "CERTIFICATE OF")
    c.drawCentredString(cx, HEIGHT - 478, "COMPLETION")

    c.setFillColor(GOLD)
    c.setFont("Times-Italic", 13)
    c.drawCentredString(cx, HEIGHT - 506, "Presented in recognition of successful program completion")

    # ---- "This certifies that" ------------------------------------------
    c.setFillColor(NAVY_SOFT)
    c.setFont("Times-Italic", 15)
    c.drawCentredString(cx, HEIGHT - 560, "This certifies that")

    # ---- Student name (prominent) ---------------------------------------
    c.setFillColor(NAVY)
    c.setFont("Times-Bold", 44)
    name_y = HEIGHT - 635
    c.drawCentredString(cx, name_y, student_name)

    # ---- Body -----------------------------------------------------------
    c.setFillColor(INK)
    c.setFont("Times-Roman", 15)
    body = ("has successfully completed the course of study in")
    c.drawCentredString(cx, name_y - 50, body)

    # ---- Course title (prominent) ---------------------------------------
    c.setFillColor(NAVY)
    c.setFont("Times-Bold", 30)
    course_y = name_y - 100
    c.drawCentredString(cx, course_y, course_title)

    c.setFillColor(INK)
    c.setFont("Times-Roman", 15)
    c.drawCentredString(cx, course_y - 40, "awarded on")

    # ---- Date issued ----------------------------------------------------
    c.setFillColor(NAVY)
    c.setFont("Times-Bold", 17)
    c.drawCentredString(cx, course_y - 80, date_issued)

    # ---- Instructor signature block -------------------------------------
    sig_y = course_y - 160
    c.setFillColor(NAVY_SOFT)
    c.setFont("Times-Italic", 12)
    c.drawCentredString(cx, sig_y + 22, "Issued by:")

    # Signature line
    c.setStrokeColor(INK)
    c.setLineWidth(0.9)
    sig_line_w = 260
    c.line(cx - sig_line_w / 2, sig_y - 8, cx + sig_line_w / 2, sig_y - 8)

    # Handwritten-style signature (bezier script stroke)
    c.saveState()
    c.translate(cx - sig_line_w / 2 + 20, sig_y - 14)
    c.setStrokeColor(NAVY)
    c.setLineWidth(1.9)
    c.setFillColor(NAVY)
    p = c.beginPath()
    p.moveTo(0, 0)
    p.curveTo(20, 22, 60, -10, 95, 6)
    p.curveTo(120, 16, 155, -12, 185, 2)
    c.drawPath(p, stroke=1, fill=0)
    # small signature swash
    p2 = c.beginPath()
    p2.moveTo(185, 2)
    p2.curveTo(200, 14, 216, -8, 228, 0)
    c.drawPath(p2, stroke=1, fill=0)
    c.restoreState()

    c.setFillColor(NAVY_SOFT)
    c.setFont("Times-Bold", 14)
    c.drawCentredString(cx, sig_y - 42, instructor_name)
    c.setFont("Times-Italic", 10.5)
    c.drawCentredString(cx, sig_y - 58, "Lead Instructor, BlueSPACE Fintech Academy")

    # ---- Footer ---------------------------------------------------------
    c.setFillColor(NAVY_SOFT)
    c.setFont("Times-Roman", 9.5)
    c.drawCentredString(cx, 78, "BlueSPACE Fintech Academy  |  Lagos, Nigeria")
    c.setFont("Times-Italic", 8.5)
    c.drawCentredString(cx, 64, "This certificate is issued electronically and is verifiable through the Academy registry.")
    c.drawCentredString(cx, 50, f"Certificate No.: BFA-CERT-{student_name.split()[-1].upper()}-{date_issued.replace('/', '')}")

    c.showPage()
    c.save()
    print(f"Certificate written to {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate a BlueSPACE student certificate PDF.")
    parser.add_argument("--name", default="Ada Nkechi Okonkwo", help="Student full name")
    parser.add_argument("--course", default="Advanced Financial Technology & Blockchain Foundations",
                        help="Course title")
    parser.add_argument("--date", default=date.today().strftime("%B %d, %Y"),
                        help="Date issued (e.g. November 09, 2026)")
    parser.add_argument("--instructor", default="Mrs. Folakemi Adebayo", help="Instructor name")
    parser.add_argument("--output", default="BlueSPACE_Certificate.pdf", help="Output PDF path")
    parser.add_argument("--logo", default=None, help="Path to academy logo image")
    args = parser.parse_args()

    logo = args.logo
    if logo is None:
        here = os.path.dirname(os.path.abspath(__file__))
        candidates = [
            os.path.join(here, "..", "public", "images", "certificate-logo.png"),
            os.path.join(here, "..", "..", "assets", "brand", "BFALogo.png"),
            os.path.join(here, "..", "..", "assets", "brand", "BFALogo2.png"),
        ]
        for candidate in candidates:
            if os.path.exists(candidate):
                logo = os.path.abspath(candidate)
                break

    generate_certificate(args.name, args.course, args.date, args.instructor,
                         args.output, logo_path=logo)


if __name__ == "__main__":
    main()
