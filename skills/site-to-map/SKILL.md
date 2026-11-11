---
name: site-to-map
description: Turn a personal homepage, link-in-bio page, navigation or bookmark site into a folded-paper 3D map where each category is a town and each link is a landmark building, tree, rock or signpost. Use when the user wants to "make my site a map", "turn this homepage / nav site / bookmarks into a 3D world", "convert <url> into the yahaha-style map", or asks for a site-to-map / 城市地图 / 3D 导航 page. Produces a site.json and a standalone page built with three.js.
---

# site-to-map

Converts a link-heavy site into the map used on yahaha.net: a paper-craft continent with
five town slots, ink-line rendering, local-time daylight, bilingual text, tour mode and
keyboard shortcuts. You write one `site.json`; the engine in `engine/` does the rest.

Read `references/site-schema.md` before writing `site.json`, and pick building shapes from
`references/kinds.json`. `examples/` in the repository holds two complete configs
(yahaha.net and wujiaxian.com) to copy from.

## Workflow

1. **Get the source.** Ask for a URL, an exported bookmarks file, or a pasted list if the
   user has not given one. For a URL run
   `node scripts/extract.mjs <url> extract.json` (first `npm install` in this skill folder; it
   renders the page with Playwright so client-side sites work). Read the result: every
   section has `heading`, `parent` (the h2 it sits under), a little `text` and its `links`.
   Open the page yourself if the extract looks thin.
2. **Plan the towns.** Group links into **three to five towns**, usually one per top-level
   category. Merge tiny categories, split none: the map has exactly five slots.
   - Drop in-page anchors, share buttons and duplicate links. A link that appears in two
     categories goes in the one where it means most; a short mention elsewhere can stay
     as a prop.
   - Up to **nine buildings** per town. Everything beyond that, and anything minor, becomes
     a **prop** (tree, rock, signpost, flower bed, statue, lamp…). Props are clickable and
     named like buildings, and sit in a ring just outside town. Do not drop links to fit.
   - Choose a slot for each town by character:
     `center` walled main town (the core category) · `coast` harbour with piers and a
     lighthouse (things that ship: apps, products) · `south` workshop quarter (code,
     side projects) · `east` market town with a fountain (social, contact) ·
     `highland` quiet plateau with a gate and waterfall (small or special sets, best ≤ 4).
3. **Name things.** Default to **original names** that fit the owner and the site:
   town names, the world name, and the nine place-name anchors (mountains, two rivers,
   forest, fields, sea, bay, western range, lake). Use a borrowed setting (Tolkien, a
   game, a film) only when the user asks for it, and say that it is fan naming. Give
   every user-facing string in both `zh` and `en` unless the site is clearly one language;
   keep proper nouns as the owner writes them.
   - Town `key`: one letter, ideally the initial of the English name, unique, and not
     `H O T V L I` (taken by overview, orbit, tour, top view, language, info card).
4. **Pick shapes.** For each link choose a `kind` from `references/kinds.json` by what the
   thing *is* (a bot → `dovecote`, an IP tool → `twin`, a blog → `scriptorium`). Avoid
   repeating a kind inside one town. Props use the `prop` kinds. Descriptions are one short
   line taken from the source, not invented claims.
5. **Style each town.** `style.walls` and `style.roofs` are palette tokens (see schema);
   give each town its own roof family so towns read apart, and set `features`
   (`walls`, `hedge`, `lamps`, `centerpiece`).
6. **Build and look.** `node scripts/build.mjs site.json out/` writes a standalone
   `out/index.html` (three.js and fonts from CDNs). Then `node scripts/check.mjs out/`
   screenshots the overview and every town into `out/_check/` and lists page errors and
   labels hidden by overlap. Look at the screenshots. Shorten names or move items to
   props when a town is crowded, rebuild, and check once more.
7. **Deliver.** Hand over `site.json`, the built folder and the screenshots. Tell the user
   what you merged, dropped or turned into props, and which names you invented.

## Integrating into an existing site

The standalone build is enough for most people. To embed in a framework (Astro, Next,
Vite): copy `engine/map-engine.js` and `engine/map.css` into the project, install
`three@0.170.0`, render the markup from `engine/template.html` (everything inside `<body>`),
and call `mountMap(site)` from a module script. Self-host the fonts there
(Manrope, JetBrains Mono, Cormorant Garamond italic) instead of Google Fonts. yahaha.net
is the reference integration.

## Rules

- Never invent links, people or claims; every `url` and description comes from the source
  or from the user.
- Keep the owner's copyright line and brand; `site.copyright.owner` is required for a
  personal site.
- Email links stay as `mailto:`; private or login-only links are left out unless asked.
- The page needs WebGL. The build always writes a `<noscript>` link list, so content stays
  reachable without JavaScript.

## Limits

- Five towns, nine buildings each; any number of props, but more than about twelve per
  town gets crowded.
- The continent, rivers and roads are fixed scenery; only names, towns and their contents
  change. Unused slots fall back to countryside, and their roads disappear.
- Building shapes come from the catalogue. A link that deserves a one-off landmark needs a
  new kind added to `engine/map-engine.js` (`makeBuilding`) and `references/kinds.json`.
