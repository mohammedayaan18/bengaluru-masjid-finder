import re
import json
import sqlite3

# Read masjid data
with open("assets/js/masjids.js", "r", encoding="utf-8") as f:
    text = f.read()

match = re.search(r"window\.MASJIDS\s*=\s*(\[.*\])\s*;?\s*$", text, re.S)

if not match:
    raise Exception("Could not find MASJIDS data")

masjids = json.loads(match.group(1))

# Open database
db = sqlite3.connect("database/masjids.db")
db.execute("PRAGMA foreign_keys = ON")

# Clear existing data
db.execute("DELETE FROM prayer_timings")
db.execute("DELETE FROM masjids")
db.execute("DELETE FROM areas")

area_ids = {}

for item in masjids:
    area = item.get("area", "Unknown").strip()
    area_slug = item.get(
        "areaSlug",
        area.lower().replace(" ", "-")
    )

    if area not in area_ids:
        cur = db.execute(
            "INSERT INTO areas (name, slug) VALUES (?, ?)",
            (area, area_slug)
        )
        area_ids[area] = cur.lastrowid

    area_id = area_ids[area]

    cur = db.execute("""
        INSERT INTO masjids
        (area_id, name, slug, address, latitude, longitude, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        area_id,
        item.get("name", ""),
        item.get("slug", ""),
        item.get("address", ""),
        item.get("latitude"),
        item.get("longitude"),
        item.get("phone")
    ))

    masjid_id = cur.lastrowid
    times = item.get("times", {})

    db.execute("""
        INSERT INTO prayer_timings
        (masjid_id, fajr, dhuhr, asr, maghrib, isha, jumuah)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        masjid_id,
        times.get("Fajr"),
        times.get("Zuhr"),
        times.get("Asr"),
        times.get("Maghrib"),
        times.get("Isha"),
        item.get("jumuah")
    ))

db.commit()

print("IMPORT COMPLETE")
print("Masjids:", db.execute("SELECT COUNT(*) FROM masjids").fetchone()[0])
print("Areas:", db.execute("SELECT COUNT(*) FROM areas").fetchone()[0])
print("Prayer timings:", db.execute("SELECT COUNT(*) FROM prayer_timings").fetchone()[0])

db.close()
