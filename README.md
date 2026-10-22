# The Vintage Weather Station — by Nikhil

A weather dashboard that uses modern open weather APIs but styles the UI
entirely like an antique 1800s barometer and thermometer using CSS
textures and SVG dials.

## How it works
| Layer | Tech |
|---|---|
| Live weather data | [Open-Meteo API](https://open-meteo.com) — free, no API key |
| Geocoding (city → coordinates) | Open-Meteo Geocoding API |
| Dials & needles | Hand-built SVG (barometer, hygrometer, thermometer) |
| Antique look | CSS gradients, film-grain overlay, brass bezels, spring-needle animation |

## Instruments
- **Barometer** — live surface pressure in inHg, spring-animated needle
  (Stormy / Fair zones like a real aneroid barometer)
- **Thermometer** — mercury column rises/falls with live temperature
- **Hygrometer** — humidity dial with damp/dry reading
- **Prognostication plates** — 7-day forecast rendered as engraved brass plates

## Run it
Just open `index.html` in a browser (or serve the folder with any static
server). No build step, no API key. Type any city and hit *Observe*.

## Ideas to impress further
- Add a wind-speed anemometer dial (`wind_speed_10m` from the API)
- Add pressure trend from `hourly` data to draw the barometer's second needle
- Sound: a soft tick when the needle settles
