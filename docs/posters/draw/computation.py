"""Vol. 10, Spirit of Computation: the Engine. The chip that crowns it is the light."""
import math

from line import CU, CUD, DEEP, GRN, HI, MID, OBS, PANEL, SH, SILK, build

CROWN = (438, 314)


def limb(p, a, b, w0, w1, lit, dark):
    (x0, y0), (x1, y1) = a, b
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    nx, ny = -dy / n, dx / n
    p.poly([(x0 + nx * w0, y0 + ny * w0), (x0, y0), (x1, y1), (x1 + nx * w1, y1 + ny * w1)], lit)
    p.poly([(x0, y0), (x0 - nx * w0, y0 - ny * w0), (x1 - nx * w1, y1 - ny * w1), (x1, y1)], dark)


def hexagon(p, x, y, r, fill):
    p.w(f'<polygon points="{" ".join(f"{x + r * math.cos(math.radians(30 + 60 * k)):.1f},{y + r * math.sin(math.radians(30 + 60 * k)):.1f}" for k in range(6))}" fill="{fill}" stroke="{HI}" stroke-width="1.2"></polygon>')


def figure(p):
    # ---------------------------------------------------------------- the engine: housing, columns of wheels, crown
    p.poly([(504, 400), (552, 392), (552, 772), (504, 772)], PANEL, f' stroke="{MID}" stroke-width="1.4"')   # the store
    for k in range(12):
        y = 410 + k * 30
        p.w(f'<rect x="512" y="{y}" width="12" height="14" fill="none" stroke="{MID}" stroke-width="1.2"></rect><rect x="530" y="{y}" width="12" height="14" fill="none" stroke="{MID}" stroke-width="1.2"></rect>')
    p.poly([(346, 760), (530, 760), (536, 784), (340, 784)], PANEL, f' stroke="{MID}" stroke-width="1.4"')
    p.poly([(356, 362), (370, 362), (370, 760), (356, 760)], PANEL, f' stroke="{MID}" stroke-width="1.4"')
    p.poly([(506, 362), (520, 362), (520, 760), (506, 760)], PANEL, f' stroke="{MID}" stroke-width="1.4"')
    p.poly([(370, 362), (506, 362), (506, 760), (370, 760)], "#0E1512")
    for cx in (395, 438, 481):                                # three columns of number wheels
        p.poly([(cx - 4, 372), (cx + 4, 372), (cx + 4, 752), (cx - 4, 752)], SH)
        for k in range(15):
            y = 382 + k * 24.6
            lit, dark = (MID, SH) if k % 2 == 0 else (CU, CUD)
            p.poly([(cx - 18, y + 3), (cx - 15, y), (cx, y), (cx, y + 18), (cx - 15, y + 18), (cx - 18, y + 15)], lit)
            p.poly([(cx + 18, y + 3), (cx + 15, y), (cx, y), (cx, y + 18), (cx + 15, y + 18), (cx + 18, y + 15)], dark)
            p.w(f'<path d="M{cx - 14} {y + 21}H{cx + 14}" stroke="{GRN}" stroke-width="3"></path>')
        p.poly([(cx - 10, 362), (cx + 10, 362), (cx + 7, 374), (cx - 7, 374)], HI)
    p.poly([(344, 348), (532, 348), (532, 362), (344, 362)], PANEL, f' stroke="{MID}" stroke-width="1.6"')      # stepped cornice
    p.poly([(364, 336), (512, 336), (512, 348), (364, 348)], PANEL, f' stroke="{MID}" stroke-width="1.4"')
    p.pads([(344, 348), (532, 348), (364, 336), (512, 336)], 2.4)
    hexagon(p, 360, 532, 13, MID)                              # the crank's hub on the housing's side
    p.w(f'<circle cx="360" cy="532" r="4.4" fill="{OBS}"></circle>')

    # the crown: a chip in a green hexagon, the light
    gx, gy = CROWN
    p.w(f'<circle cx="{gx}" cy="{gy}" r="40" fill="{SILK}" opacity=".12"></circle>')
    p.poly([(gx - 30, gy + 22), (gx + 30, gy + 22), (gx + 26, gy + 12), (gx - 26, gy + 12)], SH)
    hexagon(p, gx, gy, 22, GRN)
    p.poly([(gx - 11, gy - 11), (gx + 11, gy - 11), (gx + 11, gy + 11), (gx - 11, gy + 11)], SILK)
    p.poly([(gx - 5, gy - 5), (gx + 5, gy - 5), (gx + 5, gy + 5), (gx - 5, gy + 5)], "#FFF8E6")

    # ---------------------------------------------------------------- legs in greaves, wide stance
    limb(p, (230, 586), (200, 684), 20, 16, MID, SH)
    limb(p, (200, 684), (190, 762), 16, 14, HI, MID)
    limb(p, (276, 586), (300, 684), 20, 16, SH, DEEP)
    limb(p, (300, 684), (306, 762), 16, 14, SH, DEEP)
    for x, y in ((200, 684), (300, 684), (190, 760), (306, 760)):
        p.w(f'<circle cx="{x}" cy="{y}" r="7" fill="{GRN}" stroke="{HI}" stroke-width="1"></circle>')
    p.poly([(166, 762), (208, 762), (216, 784), (160, 784)], MID)
    p.poly([(286, 762), (322, 762), (332, 784), (288, 784)], SH)

    # ---------------------------------------------------------------- the kilt: pleats of gold and copper
    for i in range(10):
        f0, f1 = -1 + i / 5, -1 + (i + 1) / 5
        tone = (HI, CU, MID, CUD, HI, CU, MID, CUD, SH, CUD)[i]
        p.poly([(254 + f0 * 48, 506), (254 + f1 * 48, 506), (254 + f1 * 70, 600 - (i % 2) * 8), (254 + f0 * 70, 600 - (i % 2) * 8)], tone)

    # ---------------------------------------------------------------- torso in segmented plate
    p.poly([(206, 388), (244, 378), (256, 382), (256, 506), (214, 506), (208, 450)], HI)
    p.poly([(306, 388), (268, 378), (256, 382), (256, 506), (298, 506), (304, 450)], SH)
    for y in (418, 440, 462, 484):
        p.w(f'<path d="M{212 + (y - 418) * 0.05:.1f} {y}H{300}" stroke="{DEEP}" stroke-width="1.4"></path>')
    p.poly([(256, 394), (266, 408), (256, 424), (246, 408)], GRN, f' stroke="{HI}" stroke-width="1"')
    p.poly([(210, 496), (302, 496), (302, 510), (210, 510)], GRN, f' stroke="{HI}" stroke-width="1"')
    p.poly([(248, 494), (264, 494), (256, 512)], MID, f' stroke="{DEEP}" stroke-width="1"')
    for k in range(5):                                         # the feathered pauldron
        p.poly([(214, 384 + 7 * k), (176 - 4 * k, 370 + 10 * k), (182 - 4 * k, 380 + 10 * k), (214, 392 + 7 * k)], MID if k % 2 else HI)

    # ---------------------------------------------------------------- arms: one to the crank, one on the engine
    limb(p, (212, 396), (196, 466), 15, 13, MID, SH)
    limb(p, (196, 466), (236, 512), 13, 11, HI, MID)
    p.w(f'<circle cx="196" cy="466" r="7" fill="{GRN}" stroke="{HI}" stroke-width="1"></circle>')
    p.w(f'<path d="M236 512L360 532" stroke="{MID}" stroke-width="7"></path><path d="M236 512L360 532" stroke="{HI}" stroke-width="2"></path>')
    p.poly([(224, 498), (248, 500), (246, 524), (222, 522)], HI)                    # the fist on the crank
    p.w(f'<path d="M226 504H246M225 511H246M224 518H245" stroke="{DEEP}" stroke-width="1.2"></path>')
    limb(p, (300, 394), (334, 430), 14, 12, SH, DEEP)
    limb(p, (334, 430), (366, 352), 12, 10, MID, SH)
    p.w(f'<circle cx="334" cy="430" r="7" fill="{GRN}" stroke="{HI}" stroke-width="1"></circle>')
    p.poly([(352, 338), (384, 338), (386, 350), (350, 352)], MID)                  # the hand on the cornice
    p.w(f'<path d="M358 340V350M366 340V350M374 340V350" stroke="{DEEP}" stroke-width="1"></path>')

    # ---------------------------------------------------------------- neck and head, turned to the engine, a crest of spikes
    p.poly([(248, 348), (268, 348), (270, 384), (246, 384)], MID)
    p.poly([(258, 348), (268, 348), (270, 384), (258, 384)], SH)
    for k in range(7):                                         # the crest
        a = math.radians(-150 + 20 * k)
        x0, y0 = 258 + 20 * math.cos(a), 300 + 20 * math.sin(a)
        x1, y1 = 258 + 44 * math.cos(a), 300 + 44 * math.sin(a)
        p.poly([(x0 - 5 * math.sin(a), y0 + 5 * math.cos(a)), (x1, y1), (x0 + 5 * math.sin(a), y0 - 5 * math.cos(a))], MID if k % 2 else HI)
    p.poly([(236, 300), (262, 290), (286, 302), (288, 330), (276, 352), (258, 358), (240, 346), (236, 324)], HI)
    p.poly([(262, 290), (286, 302), (288, 330), (276, 352), (258, 358), (268, 320)], SH)
    p.poly([(234, 300), (288, 300), (287, 310), (235, 310)], GRN, f' stroke="{HI}" stroke-width=".8"')
    p.poly([(270, 316), (278, 314), (284, 334), (272, 336)], MID)
    p.w(f'<path d="M252 320H262M276 320H284M262 344H278" stroke="{DEEP}" stroke-width="1.6"></path>')


if __name__ == "__main__":
    print(build(10, "Computation", "l10", "THE ENGINE TURNED", CROWN, figure, plinth_hw=170))
