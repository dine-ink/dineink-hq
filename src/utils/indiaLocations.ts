// India's states and cities, extracted from `country-state-city` at build time
// into src/data/indiaLocations.json by scripts/generate-india-locations.mjs.
//
// That package bundles a world-wide database — 8.3MB of JavaScript in the
// browser (2.4MB gzipped), downloaded and parsed the moment anyone opened
// Settings, Shops or the restaurant setup modal, purely to populate an Indian
// state/city dropdown. The extracted subset is ~49KB raw with identical
// coverage (36 states, 4,242 cities).
//
// Still dynamically imported so the JSON stays out of the initial bundle and is
// fetched once, on first use, then cached by the module system.
//
// The `{ name }` object shape is kept because all three consumers render
// `c.name`. Re-run the generator if the upstream data ever needs refreshing.

type IndiaLocations = {
  states: { name: string; isoCode: string }[];
  citiesByState: Record<string, string[]>;
};

let dataPromise: Promise<IndiaLocations> | null = null;

const loadData = () => {
  if (!dataPromise) {
    dataPromise = import("@/data/indiaLocations.json").then(
      (m) => (m.default ?? m) as IndiaLocations,
    );
  }
  return dataPromise;
};

export const getIndianStates = async () => {
  const { states } = await loadData();
  return states;
};

export const getIndianCitiesForState = async (stateIsoCode: string) => {
  const { citiesByState } = await loadData();
  return (citiesByState[stateIsoCode] ?? []).map((name) => ({ name }));
};
