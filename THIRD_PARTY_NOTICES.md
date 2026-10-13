# Third-party notices

The Gilded Circuit includes or is derived from the following work by others.
npm dependencies (React, three.js, react-three-fiber, zustand and their own
dependencies) carry their licenses in their packages and are not listed here.

## SunCalc

The sun and moon positions in `web/src/sky/sky.ts` are ported from SunCalc,
https://github.com/mourner/suncalc.

```
Copyright (c) 2026, Volodymyr Agafonkin
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

## Yale Bright Star Catalogue

`web/src/sky/starCatalog.ts` is generated from the Yale Bright Star
Catalogue, 5th revised edition: Hoffleit, D. and Warren, W. H., Jr. (1991),
CDS catalogue V/50.

## Moon texture

`web/public/textures/moon/moon_color.jpg` is the LRO natural-color global
mosaic from NASA's Scientific Visualization Studio, CGI Moon Kit
(https://svs.gsfc.nasa.gov/4720), built from Lunar Reconnaissance Orbiter
Camera data (Arizona State University). Credit: NASA's Scientific
Visualization Studio. See `web/public/textures/moon/CREDITS.md`.

## Josefin Sans and IBM Plex Mono

The lettering in the brand images in `docs/brand/` (the wordmark lockups,
the hero, the social card and the section rules) is outlined from Josefin
Sans (Copyright 2010 The Josefin Sans Project Authors,
https://github.com/ThomasJockin/JosefinSansFont-master, with Reserved Font
Name "Josefin Sans") and IBM Plex Mono (Copyright 2017 IBM Corp.), both under the SIL Open Font License 1.1,
https://openfontlicense.org. No font files are included in this repository;
`docs/brand/build.py` fetches them from https://github.com/google/fonts when
it runs.

## Pinyon Script

The signature inlaid in the plaza floor is drawn in Pinyon Script (Copyright
2011 Nicole Fally), under the SIL Open Font License 1.1,
https://openfontlicense.org. The plaza loads it from Google Fonts at run time;
no font file is included in this repository.
