"""Vol. 12, Spirit of Innovation: Eureka. The burst at the heart is the light."""
import math

from line import CU, CUD, CX, DEEP, GRN, HI, MID, OBS, SH, SILK, build

HEART = (360, 404)


def limb(p, a, b, w0, w1, lit, dark):
    """A faceted limb from a to b, lit half and shaded half."""
    (x0, y0), (x1, y1) = a, b
    dx, dy = x1 - x0, y1 - y0
    n = math.hypot(dx, dy)
    nx, ny = -dy / n, dx / n
    p.poly([(x0 + nx * w0, y0 + ny * w0), (x0, y0), (x1, y1), (x1 + nx * w1, y1 + ny * w1)], lit)
    p.poly([(x0, y0), (x0 - nx * w0, y0 - ny * w0), (x1 - nx * w1, y1 - ny * w1), (x1, y1)], dark)


def figure(p):
    # ---------------------------------------------------------------- legs: the back leg bent, the front leg striding
    limb(p, (338, 586), (302, 680), 20, 16, MID, SH)          # back thigh
    limb(p, (302, 680), (284, 762), 16, 12, SH, DEEP)         # back shin
    p.poly([(266, 760), (298, 756), (304, 784), (262, 784)], SH)
    p.poly([(284, 756), (298, 756), (304, 784), (284, 784)], DEEP)
    p.w(f'<circle cx="302" cy="680" r="7" fill="{GRN}" stroke="{HI}" stroke-width="1"></circle>')
    limb(p, (382, 586), (408, 682), 20, 16, HI, MID)          # front thigh
    limb(p, (408, 682), (424, 762), 16, 13, HI, SH)           # front shin
    p.poly([(410, 758), (440, 760), (452, 784), (408, 784)], MID)
    p.poly([(426, 758), (440, 760), (452, 784), (428, 784)], SH)
    p.w(f'<circle cx="408" cy="682" r="7" fill="{GRN}" stroke="{HI}" stroke-width="1"></circle>')
    # the trace down the front leg, at 0 and 45 degrees, ending in pads
    for k in range(3):
        d = f"M{392 + 5 * k} 600V{640 + 4 * k}L{404 + 5 * k} {652 + 4 * k}V700L{412 + 5 * k} {708}V748"
        p.w(f'<path d="{d}" fill="none" stroke="{GRN}" stroke-width="2"></path>')
        p.w(f'<circle cx="{412 + 5 * k}" cy="751" r="2.4" fill="{HI}"></circle><circle cx="{392 + 5 * k}" cy="597" r="2.4" fill="{HI}"></circle>')

    # ---------------------------------------------------------------- hips, waist, belt
    p.poly([(316, 516), (360, 516), (360, 600), (336, 604), (320, 584)], HI)
    p.poly([(404, 516), (360, 516), (360, 600), (386, 604), (402, 584)], SH)
    p.poly([(318, 502), (402, 502), (402, 518), (318, 518)], GRN, f' stroke="{HI}" stroke-width="1"')
    p.w("".join(f'<circle cx="{x}" cy="510" r="3.6" fill="{MID}" stroke="{DEEP}" stroke-width=".8"></circle>' for x in (346, 360, 374)))

    # ---------------------------------------------------------------- torso
    p.poly([(292, 352), (334, 340), (360, 346), (360, 502), (318, 502), (306, 440)], HI)
    p.poly([(428, 352), (386, 340), (360, 346), (360, 502), (402, 502), (414, 440)], SH)
    p.poly([(318, 450), (360, 470), (360, 502), (318, 502)], MID)
    p.poly([(402, 450), (360, 470), (360, 502), (402, 502)], DEEP)
    for k in range(4):                                         # ribbed shoulders
        p.both([(286 - k * 3, 352 + 8 * k), (316, 346 + 8 * k), (318, 352 + 8 * k), (288 - k * 3, 358 + 8 * k)], MID, DEEP)

    # ---------------------------------------------------------------- the arms, elbows out, hands to the heart
    limb(p, (300, 352), (270, 430), 16, 13, MID, SH)           # our left
    limb(p, (270, 430), (316, 410), 13, 11, HI, MID)
    limb(p, (420, 352), (450, 430), 16, 13, DEEP, SH)          # our right
    limb(p, (450, 430), (404, 410), 13, 11, SH, MID)
    for x in (270, 450):
        p.w(f'<circle cx="{x}" cy="430" r="7" fill="{GRN}" stroke="{HI}" stroke-width="1"></circle>')
    p.poly([(308, 396), (326, 392), (330, 420), (312, 424)], HI)                 # the hands, flat to the chest
    p.poly([(412, 396), (394, 392), (390, 420), (408, 424)], SH)
    p.w(f'<path d="M312 400H327M313 407H328M314 414H329M393 400H408M392 407H407M391 414H406" stroke="{DEEP}" stroke-width="1"></path>')

    # ---------------------------------------------------------------- the burst at the heart: rods ending in pads
    hx, hy = HEART
    p.w(f'<circle cx="{hx}" cy="{hy}" r="58" fill="{SILK}" opacity=".14"></circle>')
    for i, a in enumerate(range(0, 360, 30)):
        c, s = math.cos(math.radians(a)), math.sin(math.radians(a))
        r = 66 if i % 2 == 0 else 48
        p.w(f'<path d="M{hx + 14 * c:.1f} {hy + 14 * s:.1f}L{hx + r * c:.1f} {hy + r * s:.1f}" stroke="{CU if i % 2 else MID}" stroke-width="3"></path>')
        p.w(f'<circle cx="{hx + r * c:.1f}" cy="{hy + r * s:.1f}" r="{5 if i % 2 == 0 else 3.6}" fill="{MID}" stroke="{HI}" stroke-width="1"></circle>')
    p.w(f'<circle cx="{hx}" cy="{hy}" r="19" fill="{SILK}"></circle><circle cx="{hx}" cy="{hy}" r="10" fill="#FFF8E6"></circle>')

    # ---------------------------------------------------------------- neck and head, thrown back, the hair streaming
    p.both([(348, 318), (360, 322), (360, 346), (344, 342)], MID, SH)
    for pts, c in (([(334, 240), (292, 214), (318, 252)], SH), ([(332, 256), (282, 246), (322, 272)], DEEP),
                   ([(340, 232), (310, 196), (344, 222)], MID), ([(336, 268), (296, 278), (330, 286)], SH),
                   ([(352, 226), (338, 190), (362, 218)], MID)):
        p.poly(pts, c)
    p.poly([(338, 244), (362, 230), (382, 246), (384, 278), (372, 308), (358, 324), (342, 312), (336, 280)], HI)
    p.poly([(362, 230), (382, 246), (384, 278), (372, 308), (358, 324), (362, 286)], SH)
    p.poly([(338, 244), (360, 226), (382, 242), (366, 236)], MID)
    p.w(f'<path d="M340 244L382 240" stroke="{GRN}" stroke-width="3"></path>')
    p.w(f'<path d="M346 262L356 258M368 256L378 258" stroke="{DEEP}" stroke-width="1.6"></path>')
    p.poly([(350, 290), (372, 286), (366, 304), (354, 304)], OBS)                  # the open mouth
    p.poly([(352, 291), (370, 288), (368, 293), (353, 295)], SILK)


if __name__ == "__main__":
    print(build(12, "Innovation", "l12", "THE EUREKA MOMENT", HEART, figure, plinth_hw=120))
