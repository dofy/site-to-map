# site.json

All user-facing text fields accept either a string or `{ "zh": "…", "en": "…" }`.

```jsonc
{
  "site": {
    "brand": "example.com",            // shown top left when the hostname is not in domains
    "domains": ["example.com"],         // hostnames this map is served on
    "home": "https://example.com/",     // where the brand links (default https://<domain>)
    "lang": "auto",                     // auto (browser language) | zh | en
    "storageKey": "example-map",        // localStorage prefix for the language choice
    "about": { "url": "https://…", "label": { "zh": "关于我", "en": "About me" } },  // optional
    "copyright": { "since": 2007, "owner": "Name" },   // since optional
    "version": "1.2.0",                 // optional, shown in the footer
    "releaseUrl": "https://github.com/u/r/releases/tag/v{version}",  // optional
    "description": "One sentence for <meta name=description>."
  },
  "text": {                            // overrides for interface strings, per language
    "zh": { "me": "世界名", "five": "五座城", "title": "大标题", "sub": "副标题", "intro": "信息卡介绍",
            "fold": "加载时的标题", "titleSuffix": "浏览器标签后缀" },
    "en": { "…": "same keys" }
  },
  "places": [                          // map lettering at fixed anchors
    { "at": "north", "name": { "en": "Long Ridge", "zh": "长岭" } }
    // anchors: north, riverA, riverB, forest, fields, sea, bay, west, lake
  ],
  "cities": [                          // 3–5 towns, list order = tour order
    {
      "id": "tools",                   // lowercase id, also the URL hash (#tools)
      "slot": "center",                // center | coast | south | east | highland (optional, auto-filled)
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

**Slots** keep their scenery: `highland` sits on a raised plateau with a red gate and a
waterfall; `coast` has piers, a lighthouse and boats.
