/* Nikhil's Vintage Weather Station — live data via Open-Meteo (no API key) */
const $ = id => document.getElementById(id);
const API = "https://api.open-meteo.com/v1/forecast";
const GEO = "https://geocoding-api.open-meteo.com/v1/search";

const WMO = {0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",51:"🌦️",53:"🌦️",55:"🌦️",
  61:"🌧️",63:"🌧️",65:"🌧️",66:"🌧️",67:"🌧️",71:"🌨️",73:"🌨️",75:"🌨️",77:"🌨️",
  80:"🌦️",81:"🌧️",82:"🌧️",85:"🌨️",86:"🌨️",95:"⛈️",96:"⛈️",99:"⛈️"};

/* ---------- dial construction ---------- */
function buildBarometerTicks(){
  const g = $("ticks");
  // scale: 28.0–31.6 inHg mapped over 270°, needle 0° = pointing straight up
  for(let p = 28.0; p <= 31.61; p += 0.1){
    const major = Math.abs(p % 0.5) < 0.001 || Math.abs((p*10)%5) < 0.01;
    const deg = -135 + (p - 28.0) / 3.6 * 270;
    const [x1,y1] = polar(150,150,110,deg), [x2,y2] = polar(150,150,major?98:105,deg);
    const line = document.createElementNS("http://www.w3.org/2000/svg","line");
    Object.entries({x1,y1,x2,y2,stroke:"#4a3418","stroke-width":major?2:1}).forEach(([k,v])=>line.setAttribute(k,v));
    g.appendChild(line);
    if(Math.abs((p*10)%5) < 0.01){
      const [tx,ty] = polar(150,150,84,deg);
      const t = document.createElementNS("http://www.w3.org/2000/svg","text");
      t.setAttribute("x",tx); t.setAttribute("y",ty+4); t.setAttribute("font-size","11");
      t.textContent = p.toFixed(1); g.appendChild(t);
    }
  }
}
function buildHygrometerTicks(){
  const g = $("hTicks");
  for(let h = 0; h <= 100; h += 5){
    const major = h % 25 === 0;
    const deg = -120 + h/100 * 240;
    const [x1,y1] = polar(120,120,86,deg), [x2,y2] = polar(120,120,major?76:81,deg);
    const line = document.createElementNS("http://www.w3.org/2000/svg","line");
    Object.entries({x1,y1,x2,y2,stroke:"#4a3418","stroke-width":major?2:1}).forEach(([k,v])=>line.setAttribute(k,v));
    g.appendChild(line);
    if(major){
      const [tx,ty] = polar(120,120,62,deg);
      const t = document.createElementNS("http://www.w3.org/2000/svg","text");
      t.setAttribute("x",tx); t.setAttribute("y",ty+4); t.setAttribute("font-size","11");
      t.textContent = h; g.appendChild(t);
    }
  }
}
function buildThermTicks(){
  const g = $("thermTicks");
  for(let f = -20; f <= 120; f += 10){
    const y = 290 - (f + 20) / 140 * 240;
    const major = f % 20 === 0;
    const line = document.createElementNS("http://www.w3.org/2000/svg","line");
    Object.entries({x1:76,y1:y,x2:major?90:83,y2:y,stroke:"#e8d9b5","stroke-width":major?1.6:1}).forEach(([k,v])=>line.setAttribute(k,v));
    g.appendChild(line);
    if(major){
      const t = document.createElementNS("http://www.w3.org/2000/svg","text");
      t.setAttribute("x",94); t.setAttribute("y",y+4);
      t.textContent = f; g.appendChild(t);
    }
  }
}
function polar(cx,cy,r,deg){ const a=(deg-90)*Math.PI/180; return [cx+r*Math.cos(a), cy+r*Math.sin(a)]; }

/* ---------- needle animation with physics-style easing ---------- */
let needleDeg = -135;
function setNeedle(el, target, currentRef, speed=0.06){
  // simple springy tween stored per element
  el._deg = el._deg ?? currentRef;
  cancelAnimationFrame(el._raf);
  (function step(){
    el._deg += (target - el._deg) * speed;
    el.setAttribute("transform", `rotate(${el._deg} 150 150)`);
    if(Math.abs(target - el._deg) > 0.15) el._raf = requestAnimationFrame(step);
  })();
}

/* ---------- data plumbing ---------- */
async function geocode(city){
  const r = await fetch(`${GEO}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  const j = await r.json();
  if(!j.results?.length) throw new Error("City not found in the gazetteer.");
  return j.results[0];
}
async function fetchWeather(lat, lon){
  const url = `${API}?latitude=${lat}&longitude=${lon}`
    + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
  const r = await fetch(url);
  if(!r.ok) throw new Error("Telegraph lines are down (API error).");
  return r.json();
}

function render(d, place){
  const cur = d.current;
  const inHg = cur.surface_pressure * 0.02953;
  const degF = cur.temperature_2m * 9/5 + 32;
  const feelsF = cur.apparent_temperature * 9/5 + 32;

  // barometer
  $("pressureVal").textContent = inHg.toFixed(2);
  const target = -135 + (inHg - 28.0) / 3.6 * 270;
  setNeedle($("needle"), target, -135, 0.05);
  $("trend").textContent = inHg < 29.8 ? "▼ falling — storm approaching" : inHg > 30.2 ? "▲ rising — fair & settled" : "— steady";

  // thermometer: -20°F..120°F → mercury height 240px, y from 290 (bottom) to 50
  const clamped = Math.max(-20, Math.min(120, degF));
  const h = (clamped + 20) / 140 * 240;
  $("mercury").setAttribute("y", 290 - h);
  $("mercury").setAttribute("height", h);
  $("tempVal").textContent = Math.round(degF);
  $("feels").textContent = `feels like ${Math.round(feelsF)}°F`;

  // hygrometer
  $("humVal").textContent = cur.relative_humidity_2m;
  const hDeg = -120 + cur.relative_humidity_2m / 100 * 240;
  setNeedle($("hNeedle"), hDeg, -120, 0.05);
  $("dew").textContent = cur.relative_humidity_2m > 70 ? "damp & close" : cur.relative_humidity_2m < 30 ? "dry & crisp" : "pleasant";

  // forecast plates
  const row = $("forecast"); row.innerHTML = "";
  d.daily.time.forEach((day, i) => {
    const date = new Date(day + "T12:00:00");
    const el = document.createElement("div");
    el.className = "day";
    el.innerHTML = `<h3>${i===0?"Today":date.toLocaleDateString("en-US",{weekday:"short"})}</h3>
      <div class="ico">${WMO[d.daily.weather_code[i]] ?? "🌡️"}</div>
      <p>${Math.round(d.daily.temperature_2m_max[i]*9/5+32)}° / <span class="low">${Math.round(d.daily.temperature_2m_min[i]*9/5+32)}°</span></p>`;
    row.appendChild(el);
  });

  $("status").textContent = `Observing ${place} — updated just now`;
}

$("searchForm").addEventListener("submit", async e => {
  e.preventDefault();
  const city = $("cityInput").value.trim();
  if(!city) return;
  $("status").textContent = "Consulting the observatory…";
  try{
    const g = await geocode(city);
    const place = [g.name, g.country].filter(Boolean).join(", ");
    const d = await fetchWeather(g.latitude, g.longitude);
    render(d, place);
  }catch(err){
    $("status").textContent = "⚠ " + err.message;
  }
});

/* ---------- boot: draw dials, then a default observation (Delhi) ---------- */
buildBarometerTicks(); buildHygrometerTicks(); buildThermTicks();
(async () => {
  $("status").textContent = "Consulting the observatory…";
  try{
    const g = await geocode("Delhi");
    const d = await fetchWeather(g.latitude, g.longitude);
    render(d, g.name + ", " + g.country);
  }catch{
    $("status").textContent = "Offline — check your connection, then search a city.";
  }
})();
