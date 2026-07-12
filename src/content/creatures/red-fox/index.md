---
title: The Red Fox
category: creatures
habitat: [woodland, farmland]
kind: mammal
summary: A clever, adaptable little wild dog found across the whole northern world.
tiers: [1, 2, 3]
review_status: approved
related:
  - world/printing-press
media:
  # Base plate for the anatomy diagram. The real illustration is deferred (Decision #4): ArtFrame draws a
  # token placeholder and never loads this src, so the path is inert until an asset lands. `id` is the
  # stable swap-point the diagram references; the pins sit on percentage coords, art-independent.
  - id: fox-anatomy
    kind: diagram
    variants:
      - theme: clubhouse
        src: /art/creatures/red-fox/anatomy.svg
        alt: A red fox seen from the side, with its ears, eyes, nose, coat, and tail labelled.
anatomy:
  diagram: fox-anatomy
  hotspots:
    - id: ears
      label: Ears
      x: 26
      y: 20
      blurb: Big triangular ears swivel toward the faintest rustle, so a fox can hear a mouse moving under the snow.
    - id: eyes
      label: Eyes
      x: 20
      y: 33
      blurb: Cat-like eyes with narrow pupils open wide at dusk, when a fox does most of its hunting.
    - id: nose
      label: Nose
      x: 9
      y: 44
      blurb: A cold, wet nose is the fox's sharpest sense, catching scents carried on the wind from far away.
    - id: coat
      label: Coat
      x: 56
      y: 46
      blurb: A thick red coat keeps the fox warm, and grows even bushier for the cold of winter.
    - id: tail
      label: Tail
      x: 86
      y: 56
      blurb: The long bushy tail, called a brush, steers the fox as it turns and wraps around it like a blanket in sleep.
sources:
  - title: Public-domain natural-history notes
    license: Public domain
---

Shared notes for the Red Fox. The reading-tier bodies live in `tier-1.md` … `tier-3.md`.
