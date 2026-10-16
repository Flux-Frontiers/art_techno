"""Vol. 11, Spirit of Communication: the signal raised. The satellite's chip is the light."""
import math

from line import CU, CUD, CX, DEEP, GRN, HI, MID, OBS, PANEL, SH, SILK, build

SAT = (360, 150)                 # the satellite's chip
AY = 304                         # the arch's centre


def hw(y):
    """The gown's half-width at y: narrow at the waist, a column below the hips."""
    pts = ((440, 40), (520, 54), (776, 62))
    for (y0, w0), (y1, w1) in zip(pts, pts[1:]):
        if y <= y1:
            return w0 + (y - y0) * (w1 - w0) / (y1 - y0)
    return pts[-1][1]


def arch(p, r, color, width):
    """A band of the arch, rising to a chevron at its crown."""
    pts = []
    for i in range(61):
        a = math.pi * i / 60
        x, y = CX - r * math.cos(a), AY - r * math.sin(a)
        dx = abs(x - CX)
        if dx < 22:
            y -= (22 - dx) * 0.7
        pts.append((x, y))
    d = "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts)
    p.w(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linejoin="miter"></path>')


def figure(p):
    # ---------------------------------------------------------------- the column gown
    ys = list(range(440, 777, 28)) + [776]
    for y0, y1 in zip(ys, ys[1:]):
        a, b = hw(y0), hw(y1)
        p.poly([(CX - a, y0), (CX - a / 3, y0), (CX - b / 3, y1), (CX - b, y1)], HI)
        p.poly([(CX - a / 3, y0), (CX + a / 3, y0), (CX + b / 3, y1), (CX - b / 3, y1)], MID)
        p.poly([(CX + a / 3, y0), (CX + a, y0), (CX + b, y1), (CX + b / 3, y1)], SH)
        p.poly([(CX + a, y0), (CX + a + 5, y0 + 3), (CX + b + 5, y1), (CX + b, y1)], DEEP)
    for x0, x1, y0, y1 in ((-0.66, -0.4, 470, 776), (0.4, 0.62, 500, 776), (-0.15, 0.1, 560, 776)):   # folds
        p.w(f'<path d="M{CX + x0 * hw(y0):g} {y0}L{CX + x1 * hw(y1):g} {y1}" stroke="{DEEP}" stroke-width="1" opacity=".55"></path>')
    p.w(f'<path d="M{CX:g} 448V776" stroke="{DEEP}" stroke-width="1.4"></path>')
    for side in (-1, 1):                                   # the knee bosses
        x = CX + side * (hw(640) + 2)
        p.w(f'<circle cx="{x:g}" cy="640" r="8" fill="{SH if side > 0 else MID}" stroke="{DEEP}" stroke-width="1"></circle><circle cx="{x:g}" cy="640" r="3" fill="{OBS}"></circle>')
    p.poly([(330, 784), (348, 784), (346, 776), (332, 776)], SH)
    p.poly([(372, 784), (390, 784), (388, 776), (374, 776)], DEEP)

    # ---------------------------------------------------------------- torso and stepped shoulders
    p.poly([(300, 372), (336, 360), (360, 366), (360, 440), (320, 440), (310, 404)], HI)
    p.poly([(420, 372), (384, 360), (360, 366), (360, 440), (400, 440), (410, 404)], SH)
    for i, (dy, ext) in enumerate(((0, 0), (8, 8), (16, 16))):     # three steps of shoulder
        p.both([(300 - ext, 364 + dy), (336, 356 + dy), (336, 362 + dy), (300 - ext, 370 + dy)], MID, DEEP)
    p.poly([(360, 374), (369, 385), (360, 398), (351, 385)], GRN, f' stroke="{HI}" stroke-width="1"')
    # the bus: four traces from the shoulder down across the gown, at 0 and 45 degrees, ending in pads
    for i in range(4):
        x0 = 384 + 6 * i
        d = f"M{x0} 368V{404 + 6 * i}L{x0 - 64} {468 + 6 * i}V{520 + 14 * i}"
        p.w(f'<path d="{d}" fill="none" stroke="{SH}" stroke-width="2.6"></path><path d="{d}" fill="none" stroke="{HI}" stroke-width="1"></path>')
        p.w(f'<circle cx="{x0 - 64}" cy="{524 + 14 * i}" r="3.6" fill="{SILK}" stroke="{SH}" stroke-width="1"></circle>')
    p.poly([(318, 434), (402, 434), (402, 448), (318, 448)], GRN, f' stroke="{HI}" stroke-width="1"')
    p.poly([(352, 433), (368, 433), (368, 449), (352, 449)], MID, f' stroke="{DEEP}" stroke-width="1"')

    # ---------------------------------------------------------------- neck and head
    p.both([(348, 324), (360, 328), (360, 366), (346, 360)], MID, SH)
    p.poly([(336, 270), (360, 262), (360, 332), (346, 326), (338, 310), (336, 290)], HI)
    p.poly([(384, 270), (360, 262), (360, 332), (374, 326), (382, 310), (384, 290)], SH)
    p.both([(328, 262), (344, 246), (360, 242), (360, 262), (336, 270), (332, 300), (324, 296)], MID, DEEP)   # bob
    p.poly([(330, 264), (390, 264), (389, 274), (331, 274)], GRN, f' stroke="{HI}" stroke-width=".8"')
    p.w("".join(f'<rect x="{x}" y="266" width="6" height="6" fill="{MID}"></rect>' for x in (342, 357, 372)))
    p.poly([(355, 286), (360, 283), (365, 286), (363, 306), (357, 306)], MID)
    p.w(f'<path d="M343 292H353M367 292H377M353 316H367" stroke="{DEEP}" stroke-width="1.6"></path>')

    # ---------------------------------------------------------------- the arms, raised, and the arch they hold
    p.both([(300, 368), (310, 386), (270, 392), (262, 376)], MID, SH)                # upper arms
    p.both([(254, 384), (272, 384), (264, 306), (250, 308)], HI, DEEP)               # forearms
    for side in (-1, 1):
        x = CX + side * 96
        p.w(f'<circle cx="{x:g}" cy="384" r="9" fill="{SH}" stroke="{HI}" stroke-width="1.4"></circle><circle cx="{x:g}" cy="384" r="3.4" fill="{OBS}"></circle>')
    arch(p, 124, MID, 10)
    arch(p, 108, CU, 9)
    arch(p, 93, CUD, 8)
    for a in (34, 146):                                    # the struts between the bands
        c, s = math.cos(math.radians(a)), math.sin(math.radians(a))
        p.w(f'<path d="M{CX - 88 * c:.1f} {AY - 88 * s:.1f}L{CX - 129 * c:.1f} {AY - 129 * s:.1f}" stroke="{HI}" stroke-width="3"></path>')
    p.both([(230, 300), (264, 300), (266, 314), (234, 316)], MID, SH)              # the hands under the ends
    p.w(f'<path d="M236 306H262M458 306H484" stroke="{DEEP}" stroke-width="1.2"></path>')

    # ---------------------------------------------------------------- the satellite
    sx, sy = SAT
    p.w(f'<path d="M{sx} {sy + 14}V{AY - 124 - 16}" stroke="{MID}" stroke-width="2"></path>')
    for side in (-1, 1):
        x0 = sx + side * 18
        x1 = sx + side * 78
        p.w(f'<path d="M{x0} {sy}H{sx + side * 26}" stroke="{MID}" stroke-width="2"></path>')
        lo, hi = min(sx + side * 26, x1), max(sx + side * 26, x1)
        p.poly([(lo, sy - 9), (hi, sy - 9), (hi, sy + 9), (lo, sy + 9)], MID if side < 0 else SH, f' stroke="{HI}" stroke-width="1"')
        p.w("".join(f'<path d="M{lo + k * (hi - lo) / 4:g} {sy - 9}V{sy + 9}" stroke="{DEEP}" stroke-width="1"></path>' for k in (1, 2, 3)))
        p.pads([(x1 + side * 6, sy)], 2.4)
    p.w(f'<circle cx="{sx}" cy="{sy}" r="24" fill="{SILK}" opacity=".16"></circle>')
    p.poly([(sx - 14, sy - 14), (sx + 14, sy - 14), (sx + 14, sy + 14), (sx - 14, sy + 14)], GRN, f' stroke="{HI}" stroke-width="2"')
    p.poly([(sx - 7, sy - 7), (sx + 7, sy - 7), (sx + 7, sy + 7), (sx - 7, sy + 7)], SILK)
    p.w(f'<rect x="{sx - 3}" y="{sy - 3}" width="6" height="6" fill="{HI}"></rect>')


if __name__ == "__main__":
    print(build(11, "Communication", "l11", "THE SIGNAL RAISED", SAT, figure, plinth_hw=100))
