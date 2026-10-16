"""Vol. 13, Spirit of Life: the code of the living. The orb in her hand is the light."""
import math

from line import CU, CUD, CX, DEEP, GRN, HI, MID, OBS, PANEL, SH, SILK, build

ORB = (230, 340)
STAFF = 482


def figure(p):
    # ---------------------------------------------------------------- the caduceus staff: rod, helix, chip, rays
    top, base = 262, 780
    p.poly([(STAFF - 4, top), (STAFF + 4, top), (STAFF + 4, base), (STAFF - 4, base)], MID)
    p.poly([(STAFF, top), (STAFF + 4, top), (STAFF + 4, base), (STAFF, base)], SH)
    p.poly([(STAFF - 16, base - 6), (STAFF + 16, base - 6), (STAFF + 18, base + 4), (STAFF - 18, base + 4)], SH, f' stroke="{HI}" stroke-width="1"')
    for k in range(int((base - 290) / 18)):                  # the rungs
        y = 294 + k * 18
        ph = (y - 250) / 60 * math.pi
        hw = abs(math.sin(ph)) * 18 + 3
        p.w(f'<path d="M{STAFF - hw:.1f} {y}H{STAFF + hw:.1f}" stroke="{HI}" stroke-width="2"></path>')
    for phase, color in ((0, CU), (math.pi, CUD)):         # two copper strands
        pts = [(STAFF + 20 * math.sin((y - 250) / 60 * math.pi + phase), y) for y in range(286, base - 8, 4)]
        d = "M" + "L".join(f"{x:.1f} {y}" for x, y in pts)
        p.w(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="5"></path>')
    cx, cy = STAFF, 238                                     # the chip
    for a in (-60, -30, 0, 30, 60):                         # rays of rods ending in pads
        c, s = math.sin(math.radians(a)), -math.cos(math.radians(a))
        x1, y1 = cx + 26 * c, cy - 22 + 26 * s
        x2, y2 = cx + 70 * c, cy - 22 + 70 * s
        p.w(f'<path d="M{x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}" stroke="{MID}" stroke-width="5"></path>')
        p.w(f'<circle cx="{x2:.1f}" cy="{y2:.1f}" r="8" fill="{MID}" stroke="{HI}" stroke-width="1.2"></circle>')
    p.w("".join(f'<path d="M{cx + d} {cy - 26}V{cy - 20}M{cx + d} {cy + 20}V{cy + 26}M{cx - 26} {cy + d}H{cx - 20}M{cx + 20} {cy + d}H{cx + 26}" stroke="{MID}" stroke-width="2.4"></path>' for d in (-12, -4, 4, 12)))
    p.poly([(cx - 20, cy - 20), (cx + 20, cy - 20), (cx + 20, cy + 20), (cx - 20, cy + 20)], MID, f' stroke="{HI}" stroke-width="1.6"')
    p.poly([(cx - 14, cy - 14), (cx + 14, cy - 14), (cx + 14, cy + 14), (cx - 14, cy + 14)], GRN)
    p.poly([(cx - 8, cy - 8), (cx + 8, cy - 8), (cx + 8, cy + 8), (cx - 8, cy + 8)], SILK)
    p.w(f'<rect x="{cx - 3}" y="{cy - 3}" width="6" height="6" fill="{HI}"></rect>')

    # ---------------------------------------------------------------- the halo behind her head
    hx, hy = CX, 300
    p.w(f'<circle cx="{hx}" cy="{hy}" r="74" fill="none" stroke="{MID}" stroke-width="5"></circle>')
    p.w(f'<circle cx="{hx}" cy="{hy}" r="58" fill="none" stroke="{SH}" stroke-width="4"></circle>')
    for a in (-150, -110, -70, -30, 30, 150):
        c, s = math.cos(math.radians(a)), math.sin(math.radians(a))
        p.w(f'<path d="M{hx + 58 * c:.1f} {hy + 58 * s:.1f}L{hx + 74 * c:.1f} {hy + 74 * s:.1f}" stroke="{MID}" stroke-width="3"></path>')
        p.w(f'<circle cx="{hx + 74 * c:.1f}" cy="{hy + 74 * s:.1f}" r="6" fill="{GRN}" stroke="{HI}" stroke-width="1.2"></circle>')

    # ---------------------------------------------------------------- legs and boots
    for x0, lit in ((332, True), (366, False)):
        p.poly([(x0, 600), (x0 + 22, 600), (x0 + 20, 744), (x0 + 2, 744)], HI if lit else SH)
        p.poly([(x0 + 11, 600), (x0 + 22, 600), (x0 + 20, 744), (x0 + 11, 744)], MID if lit else DEEP)
        p.w(f'<circle cx="{x0 + 11}" cy="650" r="7" fill="{GRN}" stroke="{HI}" stroke-width="1"></circle>')
        p.w(f'<circle cx="{x0 + 11}" cy="744" r="6" fill="{GRN}" stroke="{HI}" stroke-width="1"></circle>')
        p.poly([(x0 - 2, 750), (x0 + 24, 750), (x0 + 26, 784), (x0 - 6, 784)], MID if lit else SH)
        p.poly([(x0 + 14, 750), (x0 + 24, 750), (x0 + 26, 784), (x0 + 16, 784)], SH if lit else DEEP)

    # ---------------------------------------------------------------- the pleated tunic skirt, gold and copper
    wy, hy2 = 450, 614
    strips = 8
    for i in range(strips):
        f0, f1 = -1 + 2 * i / strips, -1 + 2 * (i + 1) / strips
        a, b = 52, 86
        tone = [HI, CU, HI, MID, MID, SH, CUD, SH][i]
        p.poly([(CX + f0 * a, wy), (CX + f1 * a, wy), (CX + f1 * b, hy2), (CX + f0 * b, hy2)], tone)
    p.poly([(CX - 86, hy2), (CX + 86, hy2), (CX + 84, hy2 + 14), (CX - 84, hy2 + 14)], CUD)     # under-layer
    p.w(f'<path d="M{CX - 86} {hy2}H{CX + 86}" stroke="{HI}" stroke-width="1.2"></path>')

    # ---------------------------------------------------------------- torso, pauldrons, belt
    p.poly([(296, 384), (336, 370), (360, 376), (360, 450), (308, 450), (300, 420)], HI)
    p.poly([(424, 384), (384, 370), (360, 376), (360, 450), (412, 450), (420, 420)], SH)
    for k in range(3):                                       # layered pauldrons
        d = k * 9
        p.both([(282 - k * 4, 376 + d), (316, 368 + d), (322, 378 + d), (288 - k * 4, 388 + d)], MID, DEEP)
    p.poly([(360, 388), (370, 400), (360, 414), (350, 400)], GRN, f' stroke="{HI}" stroke-width="1"')
    p.poly([(306, 440), (414, 440), (414, 454), (306, 454)], GRN, f' stroke="{HI}" stroke-width="1"')
    p.poly([(352, 438), (368, 438), (368, 456), (352, 456)], MID, f' stroke="{DEEP}" stroke-width="1"')

    # ---------------------------------------------------------------- neck, head, bob
    p.both([(348, 340), (360, 344), (360, 376), (346, 372)], MID, SH)
    p.poly([(336, 286), (360, 278), (360, 348), (346, 342), (338, 326), (336, 306)], HI)
    p.poly([(384, 286), (360, 278), (360, 348), (374, 342), (382, 326), (384, 306)], SH)
    p.both([(328, 280), (344, 262), (360, 258), (360, 278), (336, 286), (334, 320), (324, 316)], MID, DEEP)
    p.poly([(330, 280), (390, 280), (389, 290), (331, 290)], GRN, f' stroke="{HI}" stroke-width=".8"')
    p.poly([(355, 302), (360, 299), (365, 302), (363, 322), (357, 322)], MID)
    p.w(f'<path d="M343 308H353M367 308H377M353 332H367" stroke="{DEEP}" stroke-width="1.6"></path>')

    # ---------------------------------------------------------------- the orb arm (our left) and the staff arm (our right)
    p.poly([(296, 388), (306, 420), (288, 456), (274, 448)], MID)          # upper arm, down to the elbow
    p.poly([(274, 448), (290, 456), (246, 378), (232, 382)], HI)           # forearm, out and up to the hand
    p.w(f'<circle cx="282" cy="452" r="7" fill="{GRN}" stroke="{HI}" stroke-width="1"></circle>')
    p.poly([(214, 370), (250, 372), (246, 386), (218, 384)], MID)          # the open hand, under the orb
    ox, oy = ORB
    p.w(f'<circle cx="{ox}" cy="{oy}" r="34" fill="{SILK}" opacity=".16"></circle>')
    p.w(f'<circle cx="{ox}" cy="{oy}" r="27" fill="none" stroke="{MID}" stroke-width="5"></circle>')
    p.w(f'<circle cx="{ox}" cy="{oy}" r="20" fill="{SILK}"></circle><circle cx="{ox - 4}" cy="{oy - 4}" r="9" fill="#FFF8E6"></circle>')
    p.poly([(424, 388), (414, 420), (432, 456), (446, 448)], DEEP)         # upper arm
    p.poly([(446, 448), (432, 456), (466, 400), (478, 406)], SH)           # forearm, up to the staff
    p.w(f'<circle cx="438" cy="452" r="7" fill="{GRN}" stroke="{HI}" stroke-width="1"></circle>')
    p.poly([(468, 386), (498, 386), (498, 414), (468, 414)], MID)          # the fist round the rod
    p.w(f'<path d="M470 394H496M470 402H496M470 410H496" stroke="{DEEP}" stroke-width="1.2"></path>')


if __name__ == "__main__":
    print(build(13, "Life", "l13", "THE LIVING CODE", ORB, figure, plinth_hw=130))
