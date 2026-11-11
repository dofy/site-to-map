# site.json

All user-facing text fields accept either a string or `{ "zh": "…", "en": "…" }`. With
`ui.languageSwitch` off (the default) the page shows one language: `site.lang` if set, otherwise
the browser language picks from what each field has, so plain strings are enough.

```jsonc
{
  "world": {                           // optional; omit for a generated world seeded from the site
    "layout": "auto",                  // auto (generated) | classic (the fixed yahaha.net continent)
    "seed": "any string or number",    // default: brand + town ids, so each site gets its own land;
                                       // "{domain}" = the domain being visited (one land per domain)
    "type": "coast"                    // coast | twoCoasts | island | gulf | lakeland; omit to let the seed pick,
    "townSize": "fixed"                // fixed (default): towns laid out at full size, so adding or removing
                                       // buildings never moves the land | fit: real sizes, tighter, but the
                                       // layout shifts when a town crosses 2/4/6/9 buildings
  },
  "ui": {                              // optional interface features; defaults shown
    "languageSwitch": false,            // zh/en toggle button (and L key); off = one language only
    "shortcuts": false,                 // keyboard shortcuts, ? help panel and hint; Esc always works
    "tour": true,                       // Tour button: fly through every town in list order
    "views": true,                      // Orbit and Top view buttons
    "clock": true,                      // time-of-day chip in the footer
    "compass": true,                    // compass in the corner
    "daylight": "auto",                 // auto = visitor's local time; or a fixed hour 0–24, e.g. 10.5
    "intro": true,                      // pop-up-book entrance (land unfolds, buildings rise)
    "motion": true,                     // ambient life: boats, walkers, smoke, flags, clouds
    "blur": true,                       // depth-of-field and tilt-shift blur
    "infoOpen": true                    // info card starts open on wide screens (always folded on phones)
  },
  "site": {
    "brand": "example.com",            // shown top left when the hostname is not in domains
    "domains": ["example.com"],         // hostnames this map is served on
    "home": "https://example.com/",     // where the brand links (default https://<domain>)
    "lang": "auto",                     // auto (browser language) | zh | en; with one language, set it
    "storageKey": "example-map",        // localStorage prefix for the language choice
    "about": { "url": "https://…", "label": { "zh": "关于我", "en": "About me" } },  // optional
    "copyright": { "since": 2007, "owner": "Name" },   // since optional
    "version": "1.2.0",                 // optional, shown in the footer
    "releaseUrl": "https://github.com/u/r/releases/tag/v{version}",  // optional
    "description": "One sentence for <meta name=description>."
  },
  "text": {                            // overrides for interface strings, per language
    "zh": { "me": "世界名", "five": "五座城", "title": "大标题", "sub": "副标题", "intro": "信息卡介绍",
            "fold": "加载时的标题", "titleSuffix": "浏览器标签后缀", "plots": "{n} 区" },
    "en": { "…": "same keys" }
  },
  "places": [                          // map lettering at fixed anchors
    { "at": "north", "name": { "en": "Long Ridge", "zh": "长岭" } }
    // anchors: north, riverA, riverB, forest, fields, sea, bay, west, lake
  ],
  "cities": [                          // 3–9 towns, list order = tour order
    {
      "id": "tools",                   // lowercase id, also the URL hash (#tools)
      "slot": "center",                // center | coast | south | east | highland | town (optional, auto-filled;
                                       // the first five once each, town repeats for towns 6–9)
      "key": "m",                      // one-letter shortcut, not H O T V L I
      "name": { "en": "Town name", "zh": "城名" },
      "role": { "zh": "工具", "en": "Tools" },   // the category, shown under the name
      "blurb": { "zh": "一两句介绍", "en": "One or two sentences" },
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
        { "name": "Link name", "url": "https://…", "kind": "radio", "desc": { "zh": "…", "en": "…" } },
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

**Item kinds**: see `kinds.json`. `type: "building"` kinds fill the town grid (first nine);
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
