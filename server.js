const express = require("express");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const db = new DatabaseSync("database/masjids.db");

app.use(express.json());
app.use(express.static("."));
app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));

app.get("/api/masjids", (req, res) => {
    const rows = db.prepare(`
        SELECT
            m.id,
            m.name,
            a.name AS area,
            m.address,
            m.latitude,
            m.longitude,
            m.phone,
            p.fajr,
            p.dhuhr,
            p.asr,
            p.maghrib,
            p.isha,
            p.jumuah
        FROM masjids m
        JOIN areas a ON a.id = m.area_id
        LEFT JOIN prayer_timings p ON p.masjid_id = m.id
        ORDER BY m.name
    `).all();

    res.json(rows);
});

app.get("/api/masjids/:id", (req, res) => {
    const row = db.prepare(`
        SELECT
            m.*,
            a.name AS area,
            p.fajr,
            p.dhuhr,
            p.asr,
            p.maghrib,
            p.isha,
            p.jumuah
        FROM masjids m
        JOIN areas a ON a.id = m.area_id
        LEFT JOIN prayer_timings p ON p.masjid_id = m.id
        WHERE m.id = ?
    `).get(req.params.id);

    if (!row) {
        return res.status(404).json({ error: "Masjid not found" });
    }

    res.json(row);
});

app.get("/api/areas", (req, res) => {
    const rows = db.prepare(`
        SELECT id, name, slug
        FROM areas
        ORDER BY name
    `).all();

    res.json(rows);
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        masjids: db.prepare("SELECT COUNT(*) AS count FROM masjids").get().count
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`API running on http://localhost:${PORT}`);
});
