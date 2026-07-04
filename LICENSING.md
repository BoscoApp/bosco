# Licensing

Bosco uses a **split license** so the Docker image can be legally rehosted by families and schools,
while the original content is protected from commercial strip-mining (brief §7).

| What                   | Path(s)                                                | License                                                                                  |
| ---------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **Code**               | `/src`, `/scripts`, `/e2e`, config, Docker, CI         | **MIT** (see [`LICENSE`](LICENSE))                                                       |
| **Original content**   | `/content`, committed original artwork under `/static` | **CC BY-NC-SA 4.0** (see [`LICENSES/CC-BY-NC-SA-4.0.txt`](LICENSES/CC-BY-NC-SA-4.0.txt)) |
| **Third-party assets** | bundled fonts, icons, audio, images                    | their own licenses — logged in [`CREDITS.md`](CREDITS.md)                                |

## Why MIT for code (not AGPL)

Bosco is a **static, client-side site** that families **self-host** (via Docker) or that runs as
plain files on shared hosting. AGPL's network-copyleft clause never triggers for client-side code,
so it would add friction for the self-hosting audience without protecting anything — working against
the goal of "legal, easy rehosting." MIT maximizes adoption in the target network.

## Why code and content must stay separate works

CC BY-NC (NonCommercial) and MIT/GPL are **incompatible in the same file** (NC adds a restriction the
others forbid). Keeping code under `/src` and content under `/content` as separate works keeps the
split clean. Never mix MIT code and CC-BY-NC-SA content in one file.

## Status — PENDING RATIFICATION (Open Decision #11)

The **code** license (MIT) is in force now. The **content** license split above is documented and
intended, but the final ratification (and the verbatim CC legal text) is due **before public
launch**, not before coding (brief §7). Before launch:

1. Replace `LICENSES/CC-BY-NC-SA-4.0.txt` with the verbatim official CC BY-NC-SA 4.0 legal code.
2. Confirm the copyright holder's full legal name in `LICENSE`.
3. Consider adopting the REUSE spec (`REUSE.toml`) to express the per-directory split machine-readably.
