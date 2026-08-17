import re
import json
import sqlite3

# Read existing masjid data
source = open("assets/js/masjids.js", encoding="utf-8").read()

match = re.search(
    r"window\.MASJIDS\s*=\s*(\[.*\])\s*;?\s*$",
    source,
    re.S
)

if not match:
    raise SystemExit("Could not find MASJIDS data")

masjids = json.loads(match.group(1))

db = sqlite3.connect("database/masjids.db")
db.execute("PRAGMA foreign_keys = ON")

# Clear existing imported data
db.execute("DELETE FROM prayer_timings")
db.execute("DELETE FROM masjids")
db.execute("DELETE FROM areas")

area_ids = {}

for item in masjids:
    area_name = item.get("area", "Unknown").strip()
    area_slug = item.get("areaSlug", area_name.lower().replace(" ", "-"))

    if area_name not in area_ids:
        cur = db.execute(
            "INSERT INTO areas (name, slug) VALUES (?, ?)",
            (area_name, area_slug)
        )
        area_ids[area_name] = cur.lastrowid

    area_id = area_ids[area_name]

    cur = db.execute(
        """
        INSERT INTO masjids
        (area_id, name, slug, address, latitude, longitude, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            area_id,
            item.get("name", ""),
            item.get("slug", ""),
            item.get("address", ""),
            item.get("latitude"),
            item.get("longitude"),
            item.get("phone")
        )
    )

    masjid_id = cur.lastrowid
    times = item.get("times", {})

    db.execute(
        """
        INSERT INTO prayer_timings
        (masjid_id, fajr, dhuhr, asr, maghrib, isha, jumuah)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            masjid_id,
            times.get("Fajr"),
            times.get("Zuhr"),
            times.get("Asr"),
            times.get("Maghrib"),
            times.get("Isha"),
            item.get("jumuah")
        )
    )

db.commit()

print("Import complete!")
print("Masjids:", db.execute("SELECT COUNT(*) FROM masjids").fetchone()[0])
print("Areas:", db.execute("SELECT COUNT(*) FROM areas").fetchone()[0])
print("Prayer timings:", db.execute("SELECT COUNT(*) FROM prayer_timings").fetchone()[0])

db.close()
