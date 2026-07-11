---
title: Draft Basilisk (do not ship)
category: creatures
habitat: [desert]
kind: bestiary
summary: An unreviewed placeholder topic that must never appear in a production build.
tiers: [2, 3]
review_status: pending
archives:
  - title: A Fixture Bestiary (do not ship)
    file: fixture-bestiary.md
    source: Public-domain fixture
    license: Public domain
  - title: Second Fixture Source (do not ship)
    file: fixture-second.md
    source: Public-domain fixture
---

This topic exists only to prove the doctrine gate. It is `review_status: pending`, so a production
build must exclude it entirely — including its `archives`, which are here only so the populated
Archives shelf is reviewable in dev/preview. Because it now declares the Scholar tier, it also exercises
the Scholar-gated Archives shelf. None of this reaches production (the whole topic is gated out).
