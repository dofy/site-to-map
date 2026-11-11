# site.json

User-facing text fields are plain strings in the site's language (set `site.lang`). The
skill converts one language only; see *Languages* at the end for adding more by hand.

```jsonc
{
  "world": {                           // optional; omit for a generated world seeded from the site
    "layout": "auto",                  // auto (generated) | classic (the fixed yahaha.net continent)
    "seed": "any string or number",    // default: brand + town ids, so each site gets its own land;
                                       // "{domain}" = the domain being visited (one land per domain)
    "type": "coast",                   // coast | twoCoasts | island | gulf | lakeland; omit to let the seed pick
    "townSize": "fixed"                // fixed (default): towns laid out at full size, so adding or removing
                                       // buildings never moves the land | fit: real sizes, tighter, but the
                                       // layout shifts when a town crosses 2/4/6/9 buildings
  },
  "ui": {                              // optional interface features; defaults shown
    "languageSwitch": false,            // language button (and L key) for hand-added languages
    "shortcuts": false,                 // keyboard shortcuts, ? help panel and hint; Esc always works
    "tour": true,                       // Tour button: fly through every town in list order
    "views": true,                      // Orbit and Top view buttons
    "clock": true,                      // time-of-day chip in the footer
    "compass": true,                    // compass in the corner
    "daylight": "auto",                 // auto = visitor's local time, refreshed every 20s; or fixed hour, e.g. 10.5
    "intro": true,                      // pop-up-book entrance (land unfolds, buildings rise)
    "motion": true,                     // ambient life: boats, walkers, smoke, flags, clouds
    "blur": true,                       // depth-of-field and tilt-shift blur
    "infoOpen": true                    // info card starts open on wide screens; phones and tablets use a selection bubble
  },
  "site": {
    "brand": "example.com",            // shown top left when the hostname is not in domains
    "domains": ["example.com"],         // hostnames this map is served on
    "home": "https://example.com/",     // where the brand links (default https://<domain>)
    "lang": "en",                       // the content language code (zh, en, ja, fr, …); auto = browser
    "storageKey": "example-map",        // localStorage prefix for the language choice
    "links": [                          // optional site-level links beside the brand, any number
      { "name": "GitHub", "url": "https://github.com/you", "icon": "github" },
      { "name": { "en": "Blog", "ja": "ブログ" }, "url": "https://blog.example.com", "icon": "book" }
    ],                                  // icon: github, x, mail, rss, home, user, book, link,
                                        // an inline "<svg …>…</svg>", or an image URL; none = ↗ arrow
    "copyright": { "since": 2007, "owner": "Name" },   // since optional
    "version": "1.2.0",                 // optional, shown in the footer
    "releaseUrl": "https://github.com/u/r/releases/tag/v{version}",  // optional
    "description": "One sentence for <meta name=description>."
  },
  "text": {                            // overrides for interface strings, per language
    "en": { "worldName": "World name", "townCount": "{n} towns", "title": "Big title", "sub": "{n} towns, one land",
            "intro": "Info card text", "fold": "Loading title", "titleSuffix": "Tab title suffix", "plots": "{n} plots" }
  },
  "places": [                          // map lettering at fixed anchors
    { "at": "north", "name": "Long Ridge" }
    // anchors: north, riverA, riverB, forest, fields, sea, bay, west, lake
  ],
  "cities": [                          // 3–9 towns, list order = tour order
    {
      "id": "tools",                   // lowercase id, also the URL hash (#tools)
      "slot": "center",                // center | coast | south | east | highland | town (optional, auto-filled;
                                       // the first five once each, town repeats for towns 6–9)
      "key": "m",                      // one-letter shortcut, not H O T V L I
      "name": "Town name",
      "role": "Tools",                 // the category, shown under the name
      "blurb": "One or two sentences",
      "style": {
        "walls": ["paper", "wallSky", "road"],   // cycled across buildings
        "roofs": ["roofSlate", "terra", "mustard"],
        "annex": ["tower", "lantern", "tree"],   // small neighbours in plot corners
        "timber": false                          // half-timber lines on gabled houses
      },
      "features": {
        "walls": false,                // white town wall with towers
        "hedge": false,                // green hedge instead of a wall
        "lamps": true,                 // street lamps that light up at night
        "centerpiece": "fountain",     // fountain | statue | pond | none (on an empty square)
        "suburbs": 7                   // loose houses around town
      },
      "items": [
        { "name": "Link name", "url": "https://…", "kind": "radio", "desc": "One short line" },
        { "name": "Old project", "url": "https://…", "kind": "rock", "desc": "…" }   // prop kinds become props
      ]
    }
  ]
}
```

**Palette tokens** for `walls` and `roofs`: `paper`, `road`, `kraft`, `kraftDeep`, `stone`,
`slate`, `roofSlate`, `snow`, `grass`, `meadow`, `olive`, `pine`, `mustard`, `terra`,
`wallRose`, `wallSage`, `wallSky`.

**Annex kinds**: `hut`, `tower`, `banner`, `stall`, `barrels`, `crates`, `tree`, `lantern`,
`well`, `stairs`, `bench`, `anvil`, `cart`.

**Item kinds**: see `kinds.json`. Choose varied kinds that fit each item rather than repeating
one silhouette across a town: see each building kind’s `silhouette` field. When `kind` is
omitted, a stable silhouette-balanced default is assigned without inferring meaning; explicit
kinds are preserved. `type: "building"` kinds fill the town grid (first nine);
`type: "prop"` kinds, and any building past the ninth, go in the ring outside town.
`pagoda` takes `"t": 2–4` tiers.

**Slots are roles, not fixed places.** The world generator places each town by its role:
`center` near the middle, `coast` on the shore with piers, a lighthouse and boats (by a
lake in `lakeland`, without piers), `highland` on a plateau under the main mountain range
with a red gate and a waterfall, `south`, `east` and any number of `town` anywhere else on open land. With more than
five towns the generated world is scaled up (×1.2 for six … ×1.8 for nine) so towns keep
their size and spacing; `classic` cannot hold more than five.

**World types.** `coast`: one straight-ish coastline, mountains on the far side.
`twoCoasts`: land on a corner between two seas. `island`: sea all around, a ridge on one
side. `gulf`: a coast with a deep bay cut in. `lakeland`: landlocked, three lakes, rivers
flow off the map. Every type also randomises mountain ranges (one or two), one or two
rivers between towns, a road network (spanning tree plus extras and lanes off the map),
lakes, fields, farms, woods and where boats sail. Place-name anchors follow the
generated features; an anchor with nothing to point at (no lake, no second river) is
skipped.

**The land is fixed once generated.** The same `site.json` gives the same world for every
visitor on every load; only daylight and the ambient animation change. It changes when the
seed changes (an unset seed is derived from `site.brand` and the town ids), when a town is
added, removed or given another `slot`, with `townSize: "fit"` when a town crosses a size
step, and possibly when the engine's generator is upgraded. Write the chosen `seed` into
the file to keep it.

**One land per domain.** A site served on several domains can use `"seed": "{domain}"`
(or `"{domain}-v2"` to reroll them all at once). Each domain in `site.domains` then gets its
own fixed world; any other host, such as localhost or a preview deploy, falls back to
`site.brand`, so previews match the brand's world.

Preview other worlds without editing the file: `?seed=abc`, `?world=island`, or both.

## Languages

The skill writes one language. The engine can show more, but the translations are yours to
add by hand (or with another tool):

- Any text field can be `{ "<lang>": "…", … }` with any language codes, e.g.
  `"name": { "en": "Harbour", "ja": "港", "fr": "Port" }`. Missing languages fall back to `en`,
  then to the first value.
- The page language is `site.lang`, else the visitor's browser language if the content has
  it (zh-TW, zh-HK and zh-Hant pick `zh-Hant`; zh-CN and zh-Hans pick `zh`), else `en`, else
  the first language found. `site.languages` (e.g. `["en", "ja"]`) fixes the list and
  its order; otherwise it is every code used in town and link text.
- `ui.languageSwitch: true` shows a language button (and `L` key) and remembers the choice:
  with two languages it toggles, with more it opens a menu.
- Interface strings are built in for `zh`, `zh-Hant`, `ja` and `en`. Any other language starts
  from English;
  override them in `text.<lang>`. Keys: `worldName` (root of the location bar), `townCount`
  (count beside it), `title`, `sub`, `intro`, `cities`, `map`, `tour`, `spin`, `top`, `hide`, `show`, `info`, `where`, `view`, `hintW`,
  `hintC`, `plots`, `plot`, `open`, `fold`, `prep`, `titleSuffix`,
  `steps` (7 loading steps), `phases` (8 times of day: late night, sunrise, morning,
  forenoon, noon, afternoon, dusk, evening), `langName`, `keysT`, `keysClose`, `keysHint`,
  `nowebgl`. In `townCount`, `sub` and `plots`, `{n}` becomes the number of towns (or of
  places in a town); leave the count to `{n}` rather than writing a number. All keys are
  optional; the built-in text is generic ("Map · 4 towns"), so set `worldName` and `title`
  when the site has a name for its world.
- Town and place names show their `en` form large with the current language underneath when
  it differs, as on yahaha.net.

**Links beside the brand.** `site.links` takes any number of `{ name, url, icon }`. On wide
screens each shows its icon and name; below 760px only the icon (or the name, if it has no
icon), with the name kept as tooltip and accessible label. Keep it short, two or three
links; more belong in a town.
