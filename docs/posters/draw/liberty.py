"""Vol. 15, Spirit of Liberty: the key held high. The torch's keyhole is the light."""
from line import CU, CUD, CUL, CX, DEEP, GRN, HI, MID, OBS, PANEL, SH, SILK, build

WY, HY, WH, HH = 432, 778, 50, 108          # the gown: waist y, hem y, half-widths


def hw(y):
    return WH + (y - WY) * (HH - WH) / (HY - WY)


def figure(p):
    # ---------------------------------------------------------------- the tiered gown
    ledges = [470, 522, 574, 626, 678, 730, HY]
    top = WY
    for y in ledges:
        a, b = hw(top), hw(y)
        p.poly([(CX - a, top), (CX - a / 3, top), (CX - b / 3, y), (CX - b, y)], HI)
        p.poly([(CX - a / 3, top), (CX + a / 3, top), (CX + b / 3, y), (CX - b / 3, y)], MID)
        p.poly([(CX + a / 3, top), (CX + a, top), (CX + b, y), (CX + b / 3, y)], SH)
        p.poly([(CX + a, top), (CX + a + 6, top + 4), (CX + b + 6, y), (CX + b, y)], DEEP)
        for f in (0.55, 0.78):                            # ribs on the outer facets
            p.w(f'<path d="M{CX - a * f:g} {top + 2:g}L{CX - b * f:g} {y - 2:g}M{CX + a * f:g} {top + 2:g}L{CX + b * f:g} {y - 2:g}" stroke="{DEEP}" stroke-width="1" opacity=".55"></path>')
        top = y + 8
    for y in ledges:                                      # the ledge bands with their crenellations
        b = hw(y) + 8
        p.poly([(CX - b, y), (CX + b, y), (CX + b, y + 8), (CX - b, y + 8)], SH)
        p.w(f'<path d="M{CX - b:g} {y}H{CX + b:g}" stroke="{HI}" stroke-width="1.2"></path>')
        n = int(b * 2 / 14)
        p.w("".join(f'<rect x="{CX - b + (i + 0.5) * 2 * b / n - 2.5:g}" y="{y - 5}" width="5" height="5" fill="{MID}"></rect>' for i in range(n)))
    p.w(f'<path d="M346 {WY + 6}V{HY}M353 {WY + 6}V{HY}M360 {WY + 6}V{HY}M367 {WY + 6}V{HY}M374 {WY + 6}V{HY}" stroke="{DEEP}" stroke-width="1.4"></path>')
    p.pads([(346, HY + 4), (360, HY + 4), (374, HY + 4)], 2)
    p.poly([(328, 784), (346, 784), (344, 776), (330, 776)], SH)       # the feet, under the hem
    p.poly([(374, 784), (392, 784), (390, 776), (376, 776)], DEEP)

    # ---------------------------------------------------------------- torso, shoulders, belt
    p.poly([(290, 336), (330, 322), (360, 330), (360, 430), (310, 430), (302, 380)], HI)
    p.poly([(430, 336), (390, 322), (360, 330), (360, 430), (410, 430), (418, 380)], SH)
    p.poly([(290, 336), (276, 352), (296, 372), (302, 380)], MID)      # shoulder caps
    p.poly([(430, 336), (444, 352), (424, 372), (418, 380)], DEEP)
    p.poly([(330, 322), (346, 318), (360, 330)], MID)
    p.poly([(390, 322), (374, 318), (360, 330)], SH)
    p.w(f'<path d="M352 372V430M360 372V430M368 372V430" stroke="{DEEP}" stroke-width="1.4"></path>')
    p.poly([(360, 340), (370, 352), (360, 366), (350, 352)], GRN, f' stroke="{HI}" stroke-width="1"')
    p.poly([(306, 426), (414, 426), (414, 440), (306, 440)], GRN, f' stroke="{HI}" stroke-width="1"')
    p.w("".join(f'<circle cx="{x}" cy="433" r="3.6" fill="{MID}" stroke="{DEEP}" stroke-width=".8"></circle>' for x in (326, 343, 377, 394)))
    p.w(f'<circle cx="360" cy="433" r="4.6" fill="{HI}" stroke="{DEEP}" stroke-width=".8"></circle>')

    # ---------------------------------------------------------------- neck and head
    p.poly([(348, 296), (360, 300), (360, 322), (346, 318)], MID)
    p.poly([(372, 296), (360, 300), (360, 322), (374, 318)], SH)
    p.poly([(334, 248), (360, 240), (360, 304), (346, 298), (338, 284), (334, 266)], HI)     # face, lit side
    p.poly([(386, 248), (360, 240), (360, 304), (374, 298), (382, 284), (386, 266)], SH)
    p.poly([(332, 236), (346, 220), (360, 216), (360, 240), (334, 248)], MID)                # cap of hair
    p.poly([(388, 236), (374, 220), (360, 216), (360, 240), (386, 248)], DEEP)
    p.poly([(332, 244), (388, 244), (387, 254), (333, 254)], GRN, f' stroke="{HI}" stroke-width=".8"')
    p.poly([(355, 262), (360, 260), (365, 262), (363, 282), (357, 282)], MID)                 # nose
    p.w(f'<path d="M343 266H353M367 266H377M353 290H367" stroke="{DEEP}" stroke-width="1.6"></path>')

    # ---------------------------------------------------------------- the torch arm (her right, our left)
    p.poly([(290, 340), (302, 380), (282, 452), (266, 446)], MID)                  # upper arm
    p.poly([(266, 446), (282, 452), (264, 404), (250, 404)], HI)                    # forearm, up to the hand
    p.poly([(244, 392), (266, 392), (268, 414), (246, 416)], MID)                   # the fist
    p.w(f'<path d="M248 398H264M248 404H265M248 410H266" stroke="{DEEP}" stroke-width="1.2"></path>')
    p.poly([(250, 300), (262, 300), (260, 476), (252, 476)], MID)                   # shaft
    p.poly([(256, 300), (262, 300), (260, 476), (256, 476)], SH)
    p.w(f'<circle cx="256" cy="482" r="4.2" fill="{OBS}" stroke="{MID}" stroke-width="1.6"></circle>')
    p.poly([(226, 254), (286, 254), (270, 300), (242, 300)], HI)                   # the cup
    p.poly([(256, 254), (286, 254), (270, 300), (256, 300)], SH)
    p.w(f'<path d="M224 254H288M234 268H278M240 284H272" stroke="{DEEP}" stroke-width="1.2"></path>')
    # copper flame: faceted tongues around a glowing keyhole
    for pts, c in (([(232, 254), (214, 190), (240, 222)], CUD), ([(238, 254), (238, 154), (252, 214)], CU),
                   ([(250, 254), (250, 128), (262, 210)], CUL), ([(262, 254), (274, 150), (276, 220)], CU),
                   ([(272, 254), (296, 186), (282, 230)], CUD), ([(232, 254), (238, 214), (250, 254)], CU),
                   ([(262, 254), (274, 212), (280, 254)], CUD)):
        p.poly(pts, c)
    kx, ky = 256, 212                                      # the keyhole, on the cup's axis
    p.w(f'<circle cx="{kx}" cy="{ky + 14}" r="23" fill="{SILK}" opacity=".18"></circle>')
    p.w(f'<circle cx="{kx}" cy="{ky + 4}" r="12" fill="{SILK}"></circle>')
    p.poly([(kx - 7, ky + 10), (kx + 7, ky + 10), (kx + 11, ky + 40), (kx - 11, ky + 40)], SILK)
    p.w(f'<circle cx="{kx}" cy="{ky + 4}" r="5.4" fill="{HI}"></circle>')

    # ---------------------------------------------------------------- the locked tablet (her left, our right)
    p.poly([(430, 336), (444, 352), (452, 436), (432, 440)], DEEP)                  # upper arm behind
    p.poly([(372, 344), (470, 334), (476, 448), (378, 458)], PANEL, f' stroke="{MID}" stroke-width="2.2"')
    p.poly([(380, 352), (462, 343), (467, 440), (385, 448)], "none", f' stroke="{CU}" stroke-width="1"')
    p.pads([(380, 352), (462, 343), (467, 440), (385, 448)], 2.6)
    p.w(f'<path d="M412 392V380A12 12 0 0 1 436 378V390" fill="none" stroke="{HI}" stroke-width="4"></path>')
    p.poly([(404, 390), (444, 386), (446, 420), (406, 424)], MID)
    p.poly([(424, 388), (444, 386), (446, 420), (425, 422)], SH)
    p.w(f'<circle cx="425" cy="402" r="4" fill="{OBS}"></circle>')
    p.poly([(422, 404), (428, 404), (430, 414), (420, 414)], OBS)
    p.poly([(378, 430), (410, 426), (412, 450), (380, 454)], HI)                    # the hand at its foot
    p.w(f'<path d="M384 436H408M384 442H409" stroke="{DEEP}" stroke-width="1.2"></path>')


if __name__ == "__main__":
    print(build(15, "Liberty", "l15", "THE KEY HELD HIGH", (256, 222), figure))
