// country-state-city bundles a full world cities/states database (~8.6 MB) —
// dynamically imported here (once, cached) instead of a static import, so it
// only loads when a component that actually needs a state/city picker
// mounts, not on every page that happens to import this module transitively.
// Every consumer of this app only ever needs India, so the lookup is scoped
// to "IN" in one place instead of being repeated in 3 separate components.
let modulePromise: Promise<typeof import("country-state-city")> | null = null;
const loadModule = () => {
  if (!modulePromise) modulePromise = import("country-state-city");
  return modulePromise;
};

export const getIndianStates = async () => {
  const { State } = await loadModule();
  return State.getStatesOfCountry("IN");
};

export const getIndianCitiesForState = async (stateIsoCode: string) => {
  const { City } = await loadModule();
  return City.getCitiesOfState("IN", stateIsoCode);
};
