# Masjid Finder Bengaluru

A plain HTML/CSS/JavaScript directory with SEO-friendly area and masjid pages.

## Developer map
- `index.html` — homepage markup.
- `assets/styles.css` — shared styles.
- `assets/js/masjids.js` — **single source of truth for masjid data**.
- `assets/js/app.js` — homepage behavior.
- `areas/` — locality landing pages.
- `masjid/` — individual masjid pages.
- `robots.txt` / `sitemap.xml` — search-engine discovery.
- `_headers` — basic HTTP security headers.

## Change data
Edit `assets/js/masjids.js`. Do not duplicate masjid data across pages.

## Change UI
Edit `assets/styles.css` for presentation and `assets/js/app.js` for homepage behavior.

## Add an area or masjid
Add/update the data entry, then regenerate the static SEO pages and sitemap. In a future backend version, this generation can be automated.

## Important
Current prayer timings and map positions are approximate prototype data. Verify them before treating them as official.
