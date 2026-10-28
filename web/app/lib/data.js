import { feature } from "topojson-client";

// Reads the published snapshot and the borders, fetching each file once.
// A failed request is forgotten so the next attempt asks again.
export function createSnapshotData(fetchImpl = (...args) => fetch(...args)) {
  const cache = new Map();
  const getJson = (url) => {
    if (!cache.has(url)) {
      const request = fetchImpl(url).then((response) => {
        if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
        return response.json();
      });
      request.catch(() => cache.delete(url));
      cache.set(url, request);
    }
    return cache.get(url);
  };
  return {
    index: () => getJson("/data/v1/index.json").then((index) => index.entities),
    country: (code) => getJson(`/data/v1/countries/${code}.json`),
    borders: () =>
      getJson("/borders-50m.topo.json").then((topology) => ({
        countries: feature(topology, topology.objects.countries).features,
        disputed: feature(topology, topology.objects.disputed).features,
      })),
  };
}
