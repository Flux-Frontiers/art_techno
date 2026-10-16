"""Vol. 14, Spirit of Industry: the Builder. The die he lifts is the light."""
import math

from line import CU, CUD, CUL, DEEP, GRN, HI, MID, OBS, PANEL, SH, SILK, build

DIE = (318, 240)


def limb(p, a, b, w0, w1, lit, dark):
    (x0, y0), (x1, y1) = a, b
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    nx, ny = -dy / n, dx / n
    p.poly([(x0 + nx * w0, y0 + ny * w0), (x0, y0), (x1, y1), (x1 + nx * w1, y1 + ny * w1)], lit)
    p.poly([(x0, y0), (x0 - nx * w0, y0 - ny * w0), (x1 - nx * w1, y1 - ny * w1), (x1, y1)], dark)


def figure(p):
    # ---------------------------------------------------------------- the robot arm, copper, from its pedestal to the die
    p.poly([(476, 744), (532, 744), (540, 784), (468, 784)], CUD, f' stroke="{MID}" stroke-width="1.2"')
    joints = [(504, 744), (520, 600), (494, 452), (392, 292)]
    widths = [20, 17, 14]
    for (a, b), wd in zip(zip(joints, joints[1:]), widths):
        limb(p, a, b, wd, wd - 2, CU, CUD)
    for x, y in joints[1:]:
        p.w(f'<polygon points="{" ".join(f"{x + 13 * math.cos(math.radians(30 + 60 * k)):.1f},{y + 13 * math.sin(math.radians(30 + 60 * k)):.1f}" for k in range(6))}" fill="{MID}" stroke="{HI}" stroke-width="1.2"></polygon><circle cx="{x}" cy="{y}" r="4.4" fill="{OBS}"></circle>')
    for k in range(5):                                         # cooling fins on the upper segment
        t = 0.3 + 0.08 * k
        x, y = 494 + (392 - 494) * t, 452 + (292 - 452) * t
        p.w(f'<path d="M{x:.1f} {y:.1f}L{x + 18:.1f} {y + 10:.1f}" stroke="{CUL}" stroke-width="3"></path>')
    p.poly([(358, 250), (386, 270), (382, 300), (356, 284)], CU, f' stroke="{MID}" stroke-width="1"')   # the gripper, on the die's edge
    p.poly([(366, 262), (380, 272), (377, 288), (364, 280)], GRN)

    # ---------------------------------------------------------------- the stepped tower, black glass and copper
    tx = 412
    steps = [(784, 56), (734, 50), (684, 45), (634, 40), (584, 35), (534, 30), (484, 25), (434, 20)]
    for (y1, h1), (y0, _) in zip(steps, steps[1:] + [(400, 0)]):
        p.poly([(tx - h1, y0), (tx + h1, y0), (tx + h1, y1), (tx - h1, y1)], PANEL, f' stroke="{MID}" stroke-width="1.6"')
        p.w(f'<path d="M{tx:g} {y0}V{y1}" stroke="{MID}" stroke-width="1"></path>')
        for side in (-1, 1):                                   # copper ribbing, rising in steps
            for k in range(4):
                x = tx + side * (h1 * 0.25 + k * h1 * 0.16)
                p.w(f'<path d="M{x:.1f} {y1 - 6}V{y0 + 12 + abs(k - 1.5) * 6:.1f}" stroke="{CU}" stroke-width="2.2"></path>')
    p.poly([(tx - 10, 400), (tx + 10, 400), (tx + 10, 434), (tx - 10, 434)], PANEL, f' stroke="{MID}" stroke-width="1.6"')
    p.pads([(tx, 396)], 3)

    # ---------------------------------------------------------------- legs, wide stance
    limb(p, (280, 580), (250, 680), 22, 18, MID, SH)
    limb(p, (250, 680), (240, 760), 18, 15, HI, MID)
    limb(p, (322, 580), (334, 680), 22, 18, SH, DEEP)
    limb(p, (334, 680), (338, 760), 18, 15, SH, DEEP)
    p.poly([(216, 756), (256, 756), (262, 784), (210, 784)], MID)
    p.poly([(320, 756), (356, 756), (364, 784), (322, 784)], SH)

    # ---------------------------------------------------------------- torso, apron, belt, fins at the shoulders
    p.poly([(250, 392), (292, 382), (300, 386), (300, 586), (266, 586), (258, 470)], HI)
    p.poly([(350, 392), (308, 382), (300, 386), (300, 586), (334, 586), (342, 470)], SH)
    p.poly([(270, 410), (330, 410), (334, 650), (300, 664), (266, 650)], MID)          # the apron, to a point
    for k in range(9):                                           # gold and copper pleats
        x = 274 + k * 6.5
        p.w(f'<path d="M{x:.1f} 414V{648 + (6 if 2 < k < 6 else 0)}" stroke="{CU if k % 2 else DEEP}" stroke-width="2"></path>')
    p.poly([(300, 426), (310, 438), (300, 452), (290, 438)], GRN, f' stroke="{HI}" stroke-width="1"')
    p.poly([(256, 522), (344, 522), (344, 536), (256, 536)], MID, f' stroke="{DEEP}" stroke-width="1"')
    p.poly([(286, 520), (314, 520), (314, 538), (286, 538)], GRN, f' stroke="{HI}" stroke-width="1"')
    p.pads([(294, 529), (300, 529), (306, 529)], 2.2)
    for k in range(5):                                           # the fins at each shoulder
        p.w(f'<path d="M{246 - k * 4} {396 + k * 9}H{220 - k * 6}M{354 + k * 4} {396 + k * 9}H{378 + k * 6}" stroke="{MID}" stroke-width="4"></path>')

    # ---------------------------------------------------------------- the arms, raised to the die
    limb(p, (258, 392), (238, 320), 15, 13, MID, SH)
    limb(p, (238, 320), (282, 272), 13, 11, HI, MID)
    limb(p, (342, 392), (356, 318), 15, 13, DEEP, SH)
    limb(p, (356, 318), (348, 274), 13, 11, SH, MID)
    p.poly([(270, 262), (294, 264), (292, 282), (268, 280)], HI)
    p.poly([(336, 264), (360, 262), (362, 280), (338, 282)], SH)

    # ---------------------------------------------------------------- neck and head, turned up to the die
    p.poly([(286, 350), (310, 350), (312, 386), (284, 386)], MID)
    p.poly([(302, 350), (310, 350), (312, 386), (302, 386)], SH)
    p.poly([(272, 304), (298, 294), (324, 304), (326, 334), (314, 356), (296, 362), (278, 350), (272, 330)], HI)
    p.poly([(298, 294), (324, 304), (326, 334), (314, 356), (296, 362), (304, 324)], SH)
    p.poly([(270, 306), (282, 288), (304, 282), (326, 296), (324, 304), (298, 294)], MID)       # cropped hair
    p.poly([(302, 314), (308, 312), (312, 334), (304, 336)], MID)                               # nose, turned up
    p.w(f'<path d="M286 316H296M312 314H320M298 346H312" stroke="{DEEP}" stroke-width="1.6"></path>')

    # ---------------------------------------------------------------- the die, with its sunburst of rods
    dx, dy = DIE
    for a in range(-80, 81, 16):
        c, s = math.sin(math.radians(a)), -math.cos(math.radians(a))
        x0, y0 = dx + 44 * c, dy - 10 + 44 * s
        r = 104 if a % 32 == 0 else 86
        x1, y1 = dx + r * c, dy - 10 + r * s
        p.w(f'<path d="M{x0:.1f} {y0:.1f}L{x1:.1f} {y1:.1f}" stroke="{MID}" stroke-width="4"></path>')
        p.w(f'<circle cx="{x1:.1f}" cy="{y1:.1f}" r="7" fill="{MID}" stroke="{HI}" stroke-width="1.2"></circle>')
    p.w(f'<circle cx="{dx}" cy="{dy}" r="58" fill="{SILK}" opacity=".12"></circle>')
    p.poly([(dx - 42, dy - 42), (dx + 42, dy - 42), (dx + 42, dy + 42), (dx - 42, dy + 42)], MID, f' stroke="{HI}" stroke-width="2"')
    p.poly([(dx - 34, dy - 34), (dx + 34, dy - 34), (dx + 34, dy + 34), (dx - 34, dy + 34)], GRN)
    p.w("".join(f'<path d="M{dx - 30} {dy - 30 + 6 * k}H{dx + 30}" stroke="{MID}" stroke-width=".8" opacity=".7"></path>' for k in range(11)))
    p.poly([(dx - 18, dy - 18), (dx + 18, dy - 18), (dx + 18, dy + 18), (dx - 18, dy + 18)], SILK)
    p.poly([(dx - 9, dy - 9), (dx + 9, dy - 9), (dx + 9, dy + 9), (dx - 9, dy + 9)], "#FFF8E6")


if __name__ == "__main__":
    print(build(14, "Industry", "l14", "THE BUILDER", DIE, figure, plinth_hw=150))
