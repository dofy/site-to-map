# site-to-map

English | [简体中文](README.zh-CN.md)

An agent skill that turns a personal homepage, link-in-bio page or navigation site into a
**folded-paper 3D map**: every category becomes a town, every link a landmark building,
and links that don't need a building become trees, rocks or signposts you can still click.

It is the engine behind [yahaha.net](https://yahaha.net), extracted so any site can be
converted with one `site.json`.

![yahaha.net as a map](docs/yahaha-net.png)

## What you get

- A paper-craft world drawn with three.js and **generated from a seed**: five world types
  (coast, two coasts, island, gulf, lakeland), one or two mountain ranges, rivers, lakes,
  roads with bridges, forests, fields, boats, travellers and ink-line edges. Each site gets
  its own land; `?seed=` and `?world=` preview others.
- Three to nine towns placed by role (walled centre, harbour, workshop quarter, market
  town, highland, then any number of plain towns), nine buildings each and any number of
  props around them. More than five towns grows the world to fit.
- 37 building shapes and 12 props, picked per link by meaning (a bot is a dovecote, an IP
  tool is two towers with a sky bridge, a blog is a clock tower).
- Light, sky and street lamps follow the visitor's local time across eight phases; the
  interface colours follow too.
- Opens from the sea looking inland, with no peak hiding a town; the camera arcs between
  towns, and the Map button returns to that opening view.
- Guided tour, orbit and top views, Shift/Space drag to pan, a no-JavaScript link list.
- A few site-level links beside the brand (GitHub, blog, email…) with icons, collapsing to
  icons on phones.
- Written in the site's own language. Interface text is built in for Simplified Chinese,
  Traditional Chinese, Japanese and English; any other language takes its interface strings
  from `site.json`. The engine can also switch between languages you add by hand; the skill
  itself does not translate.
- Optional (off by default): keyboard shortcuts. Tour, view buttons, clock, compass, fixed
  daylight, entrance animation, motion and blur can be switched in `site.json` → `ui`.

## Install

Tell your agent:

```text
Install the site-to-map skill from https://github.com/dofy/site-to-map
```

Or install it yourself:

```text
/plugin install site-to-map --marketplace dofy/site-to-map    # Claude Code 2.1.275+
npx skills add dofy/site-to-map                               # Codex, Cursor and other agents
```

The skill installs its script dependencies the first time it runs. Playwright reads pages
and takes screenshots; a static HTML fallback is available when browser extraction fails.

## Use

Give the agent a site and say what you want:

```text
Turn https://example.com into a site-to-map page.
```

```text
Make my bookmarks (bookmarks.html) into a map with four towns and an island world.
```

The agent reads the site, plans the towns, names them, picks a building for every link,
generates the land, builds a standalone page and checks it with screenshots. It tells you
what it merged or turned into props, and you can ask for changes the same way:

```text
Put GitHub and the blog in one town. Try another seed. Turn on keyboard shortcuts.
```

Serve the output folder over HTTP to open it (ES modules don't load from `file://`).
Options worth knowing, all optional: number or grouping of towns, `world.type` and
`world.seed` (including `"{domain}"` for one land per domain), `site.links`, `ui.shortcuts`
(off by default) and the rest of `ui`. Adding languages by hand is described under *Languages* in
[`references/site-schema.md`](skills/site-to-map/references/site-schema.md).

<details>
<summary>Running the scripts by hand</summary>

```bash
cd <skill folder> && npm install                            # once
node scripts/extract.mjs https://example.com extract.json   # sections and links
# write site.json (see references/site-schema.md)
node scripts/build.mjs site.json out                        # standalone out/index.html
node scripts/check.mjs out                                  # screenshots + problems in out/_check
```

</details>

## One site, four worlds

[yahaha.net](https://yahaha.net) is served on four domains with `"seed": "{domain}"`, so one
`site.json` grows a different world on each: a western coast, an island, a gulf with a
lake, and a landlocked lake country. Same towns, same buildings, different land.

| | |
|---|---|
| [yahaha.net](https://yahaha.net) ![](docs/yahaha-net.png) | [dofy.net](https://dofy.net) ![](docs/dofy-net.png) |
| [PHPz.xyz](https://phpz.xyz) ![](docs/phpz-xyz.png) | [PHPz.org](https://phpz.org) ![](docs/phpz-org.png) |

Its full config is [`src/data/map.json`](https://github.com/dofy/yahaha/blob/main/src/data/map.json)
in dofy/yahaha.

## Layout

```
skills/site-to-map/
├── SKILL.md                 workflow and rules for the agent
├── engine/                  map-engine.js (three.js), world-gen.js, map.css, template.html
├── references/              site-schema.md, site.schema.json, kinds.json (shape catalogue)
└── scripts/                 extract.mjs, build.mjs, check.mjs
.claude-plugin/               Claude Code plugin and marketplace manifests
docs/                        README screenshots
```

## License

MIT. three.js is MIT and is loaded from jsDelivr by the standalone page. Fonts (Manrope,
JetBrains Mono, Cormorant Garamond) are under the SIL Open Font License.
