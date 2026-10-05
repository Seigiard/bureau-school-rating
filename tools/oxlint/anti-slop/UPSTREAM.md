# Source

- Repository: https://github.com/dmmulroy/anti-slop
- Commit: c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b
- Copied: `skills/install-anti-slop/assets/anti-slop/`, verified identical to canonical `src/` by upstream's `scripts/sync-skill-assets.mjs --check`.
- Installed: `tools/oxlint/anti-slop/`, including Effect rules and Stylistic license/provenance. Source files are unchanged. This provenance file and upstream's root MIT license are added.
- Runtime: Node 24; exact oxlint and @oxlint/plugins versions 1.87.0 in the isolated `tools/oxlint` npm package.
- Policy: all 18 generic rules and `oxc/no-accumulating-spread` enabled as errors. Effect rules are not enabled because there is no direct Effect dependency. Other Oxlint default correctness rules are outside this rollout; existing checks are preserved.
- Run from repository root: `npm ci --prefix tools/oxlint --ignore-scripts --no-audit --no-fund`, then `npm run lint:anti-slop`.
