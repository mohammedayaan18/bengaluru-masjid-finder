/* Main UI logic. Data lives in assets/js/masjids.js. */
(() => {
  let data = [];
  const $ = (id) => document.getElementById(id);
  const normalize = (value) => String(value || "").toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

  const aliases = {
    "btm":"BTM Layout","jaya nagar":"Jayanagar","shivaji nagar":"Shivajinagar",
    "shivaji":"Shivajinagar","fraser town":"Frazer Town","city market":"KR Market",
    "r t nagar":"RT Nagar","white field":"Whitefield","jp":"JP Nagar",
    "kora mangala":"Koramangala","bannerghatta":"Bannerghatta Road",
    "ecity":"Electronic City","k r puram":"KR Puram","t c palya":"TC Palya",
    "hebbal":"Hegde Nagar"
  };

  function nextPrayer() {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const prayers = [["Fajr",310],["Zuhr",795],["Asr",1005],["Maghrib",1128],["Isha",1220]];
    return prayers.find(([,time]) => time > minutes)?.[0] || "Fajr tomorrow";
  }

  function card(m) {
    return `<article class="card">
      <span class="badge">Approx. Jamaat timings</span>
      <h3>🕌 ${escapeHtml(m.name)}</h3>
      <div class="address">📍 ${escapeHtml(m.address)}</div>
      <div class="next">⏱ <b>Next prayer:</b> ${nextPrayer()}</div>
      <table>
        <tr><th>Prayer</th><th>Approx. Jamaat</th></tr>
        ${["Fajr","Zuhr","Asr","Maghrib","Isha"].map(p => `<tr><td>${p}</td><td>${escapeHtml(m.times[p])}</td></tr>`).join("")}
      </table>
      <div class="jumuah"><strong>🕋 Jumu'ah</strong><span>${escapeHtml(m.jumuah)}</span></div>
      <div class="actions">
        <a class="map-link" href="${m.map}" target="_blank" rel="noopener">📍 Directions</a>
        <a class="secondary-link" href="#map" data-focus="${escapeAttr(m.name)}">🗺️ Show on map</a>
      </div>
    </article>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }
  const escapeAttr = escapeHtml;

  function setupSearch() {
    const input = $("search"), suggestions = $("suggestions");
    if (!input) return;
    const areas = [...new Set(data.map(m => m.area))].sort();
    let timer;
    input.addEventListener("input", () => {
      const query = input.value.trim(), n = normalize(query);
      if (!n) { suggestions.style.display = "none"; render(); return; }
      const areaHits = areas.filter(a => normalize(a).includes(n) || n.includes(normalize(a))).slice(0,7);
      const masjidHits = data.filter(m => normalize(`${m.name} ${m.area} ${m.address}`).includes(n)).slice(0,7);
      let html = areaHits.map(a => `<button class="suggestion" data-area="${escapeAttr(a)}"><span><b>📍 ${escapeHtml(a)}</b><small>${data.filter(m=>m.area===a).length} masjids in this area</small></span><em>AREA</em></button>`).join("");
      html += masjidHits.map(m => `<button class="suggestion" data-masjid="${escapeAttr(m.name)}"><span><b>🕌 ${escapeHtml(m.name)}</b><small>${escapeHtml(m.area)}</small></span><em>MASJID</em></button>`).join("");
      if (html) { suggestions.innerHTML = html; suggestions.style.display = "block"; }
      clearTimeout(timer);
      timer = setTimeout(() => render(), 100);
    });
    suggestions.addEventListener("click", e => {
      const button = e.target.closest(".suggestion");
      if (!button) return;
      if (button.dataset.area) {
        $("area").value = button.dataset.area;
        input.value = button.dataset.area;
      } else if (button.dataset.masjid) {
        $("area").value = "ALL";
        input.value = button.dataset.masjid;
      }
      suggestions.style.display = "none";
      render();
    });
    document.addEventListener("click", e => { if (!e.target.closest(".search-box")) suggestions.style.display = "none"; });
  }

  function setupAreas() {
    const select = $("area"), chips = $("chips");
    if (!select) return;
    const areas = [...new Set(data.map(m=>m.area))].sort();
    areas.forEach(a => select.insertAdjacentHTML("beforeend", `<option value="${escapeAttr(a)}">${escapeHtml(a)}</option>`));
    const makeChip = (label, value) => `<button class="chip" data-area-chip="${escapeAttr(value)}">${escapeHtml(label)}</button>`;
    chips.innerHTML = makeChip("All","ALL") + areas.map(a=>makeChip(a,a)).join("");
    select.addEventListener("change", () => { $("search").value = ""; render(); });
    chips.addEventListener("click", e => {
      const b=e.target.closest("[data-area-chip]"); if(!b)return;
      select.value=b.dataset.areaChip; $("search").value=""; render();
    });
  }

  let map, markers;
  function setupMap() {
    if (!window.L || !$("map")) return;
    map = L.map("map").setView([12.9716,77.5946],11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom:19, attribution:"© OpenStreetMap contributors"
    }).addTo(map);
    markers = L.layerGroup().addTo(map);
  }

  function approximateCoords(m) {
    const centers = {
      "BTM Layout":[12.916,77.610],"Jayanagar":[12.929,77.583],"Whitefield":[12.969,77.750],
      "Shivajinagar":[12.986,77.604],"Koramangala":[12.935,77.615],"Halasuru":[12.978,77.619],
      "RT Nagar":[13.019,77.594],"Yelahanka":[13.101,77.596],"Electronic City":[12.845,77.660],
      "JP Nagar":[12.907,77.585],"Basavanagudi":[12.943,77.575],"KR Market":[12.963,77.577]
    };
    const c=centers[m.area] || [12.9716,77.5946];
    let hash=0; for(const ch of m.name) hash=(hash*31+ch.charCodeAt(0))>>>0;
    return [c[0]+((hash%100)-50)*.00008,c[1]+(((hash>>8)%100)-50)*.00008];
  }

  function drawMarkers(list) {
    if (!markers) return;
    markers.clearLayers();
    list.forEach(m => {
      const [lat,lng]=approximateCoords(m);
      L.marker([lat,lng]).bindPopup(`<b>🕌 ${escapeHtml(m.name)}</b><br><small>${escapeHtml(m.area)}<br>${escapeHtml(m.address)}</small><br><a href="${m.map}" target="_blank">Directions</a>`).addTo(markers);
    });
    $("mapStatus").textContent=`${list.length} masjid${list.length===1?"":"s"} shown on map`;
  }

  function render() {
    const query=normalize($("search")?.value), selected=$("area")?.value || "ALL";
    const actualArea=aliases[query] && selected==="ALL" ? aliases[query] : selected;
    const filtered=data.filter(m => {
      if(actualArea!=="ALL" && m.area!==actualArea) return false;
      if(!query) return true;
      const hay=normalize(`${m.name} ${m.area} ${m.address}`);
      return hay.includes(query) || query.split(" ").every(w=>hay.includes(w));
    });
    const groups={}; filtered.forEach(m => (groups[m.area] ||= []).push(m));
    $("results").innerHTML=Object.keys(groups).sort().map(area => `<section class="area-section"><div class="area-header"><h3>📍 ${escapeHtml(area)}</h3><span>${groups[area].length} masjid${groups[area].length===1?"":"s"}</span></div><div class="grid">${groups[area].map(card).join("")}</div></section>`).join("");
    $("empty").style.display=filtered.length ? "none" : "block";
    $("count").textContent=`${filtered.length} masjid${filtered.length===1?"":"s"}`;
    $("heading").textContent=actualArea==="ALL" ? (query ? "Search results" : "All Bengaluru Masajid") : `${actualArea} Masajid`;
    drawMarkers(filtered);
    document.querySelectorAll("[data-area-chip]").forEach(b=>b.classList.toggle("active",b.dataset.areaChip===actualArea));
  }

  function setupNearMe() {
    $("near")?.addEventListener("click", () => {
      if (!navigator.geolocation) return alert("Location is not supported by this browser.");
      navigator.geolocation.getCurrentPosition(pos => {
        const {latitude,longitude}=pos.coords;
        if(map) { map.setView([latitude,longitude],14); L.marker([latitude,longitude]).addTo(map).bindPopup("📍 You are here").openPopup(); }
        const nearest=data.map(m=>({m,distance:distanceKm(latitude,longitude,...approximateCoords(m))})).sort((a,b)=>a.distance-b.distance).slice(0,12);
        $("heading").textContent="Masjids near you"; $("count").textContent=`${nearest.length} nearby masjids`;
        $("results").innerHTML=`<section class="area-section"><div class="area-header"><h3>📍 Masjids near you</h3><span>Approximate distance</span></div><div class="grid">${nearest.map(x=>card(x.m)).join("")}</div></section>`;
        drawMarkers(nearest.map(x=>x.m));
      }, () => alert("Location permission was denied."));
    });
  }
  function distanceKm(a,b,c,d){const r=Math.PI/180,x=(c-a)*r,y=(d-b)*r;const q=Math.sin(x/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)**2;return 6371*2*Math.asin(Math.sqrt(q));}

  document.addEventListener("click", e => {
    const link=e.target.closest("[data-focus]");
    if(!link || !map)return;
    const m=data.find(x=>x.name===link.dataset.focus); if(!m)return;
    const [lat,lng]=approximateCoords(m); map.setView([lat,lng],16);
  });

  async function loadData() {
  try {
    const response = await fetch("/api/masjids");
    if (!response.ok) throw new Error("API request failed");

    const rows = await response.json();

    data = rows.map(m => ({
      ...m,
      times: {
        Fajr: m.fajr,
        Zuhr: m.dhuhr,
        Asr: m.asr,
        Maghrib: m.maghrib,
        Isha: m.isha
      },
      map: m.map || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.name + " " + m.address)}`
    }));

    setupSearch();
    setupAreas();
    setupMap();
    setupNearMe();
    render();

    console.log(`Loaded ${data.length} masjids from API`);
  } catch (error) {
    console.error("Failed to load masjid data:", error);
    $("results").innerHTML = "<p>Unable to load masjid data.</p>";
  }
}

loadData();
})();