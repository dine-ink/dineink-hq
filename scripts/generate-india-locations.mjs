/**
 * Generates src/data/indiaLocations.json from the `country-state-city`
 * package — India only, name + isoCode only.
 *
 * That package bundles a world-wide database: 17MB on disk, 8.3MB of JS in the
 * browser bundle, all so three components can offer an Indian state/city
 * picker. Extracting the India subset once at build time keeps identical data
 * coverage for a fraction of the payload, and lets us drop the dependency.
 *
 * Re-run with:  node scripts/generate-india-locations.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { State, City } from "country-state-city";

const states = State.getStatesOfCountry("IN")
  .map((s) => ({ name: s.name, isoCode: s.isoCode }))
  .sort((a, b) => a.name.localeCompare(b.name));

const citiesByState = {};
let cityCount = 0;
for (const state of states) {
  const names = [
    ...new Set(City.getCitiesOfState("IN", state.isoCode).map((c) => c.name)),
  ].sort((a, b) => a.localeCompare(b));
  citiesByState[state.isoCode] = names;
  cityCount += names.length;
}

mkdirSync("src/data", { recursive: true });
const out = { states, citiesByState };
writeFileSync("src/data/indiaLocations.json", JSON.stringify(out));
const bytes = JSON.stringify(out).length;
console.log(
  `wrote src/data/indiaLocations.json — ${states.length} states, ${cityCount} cities, ${(bytes / 1024).toFixed(0)}KB raw`,
);
