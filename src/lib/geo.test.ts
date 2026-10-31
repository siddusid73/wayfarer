import { afterEach, describe, expect, it, vi } from "vitest";
import { getPois } from "./geo";

afterEach(() => vi.unstubAllGlobals());

describe("nearby places", () => {
  it("falls back to bounded search when Overpass fails, excludes wrong categories and places beyond 5 km", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("Failed to fetch")).mockResolvedValueOnce({ ok: true, json: async () => [
      { place_id: 1, osm_type: "way", osm_id: 10, name: "Nearby hotel", display_name: "Nearby hotel, India", type: "hotel", lat: "16.512", lon: "80.617" },
      { place_id: 2, osm_type: "node", osm_id: 20, name: "Distant hotel", display_name: "Distant hotel, India", type: "hotel", lat: "16.56", lon: "80.66" },
      { place_id: 3, osm_type: "node", osm_id: 30, name: "Wrong category", display_name: "Wrong category, India", type: "restaurant", lat: "16.512", lon: "80.617" },
    ] });
    vi.stubGlobal("fetch", fetchMock);
    const results = await getPois("stay", { name: "Vijayawada", lat: 16.5115306, lon: 80.6160469 });
    expect(results.map((p) => p.id)).toEqual(["way/10"]);
    const url = new URL(fetchMock.mock.calls[1]?.[0]);
    expect(url.hostname).toBe("nominatim.openstreetmap.org");
    expect(url.searchParams.get("bounded")).toBe("1");
    expect(url.searchParams.get("q")).toBe("hotel");
  });

  it("does not launch the backup for a cancelled search", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    const fetchMock = vi.fn().mockRejectedValue(new Error("Aborted"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(getPois("food", { name: "Other stop", lat: 17, lon: 81 }, 5000, ctrl.signal)).rejects.toThrow("Aborted");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ignores malformed Overpass places without crashing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ elements: [
      { id: 1, type: "way", tags: { name: "No coordinates" } },
      { id: 2, type: "way", tags: { name: "Museum" }, center: { lat: 18, lon: 82 } },
    ] }) }));
    expect(await getPois("sight", { name: "Stop", lat: 18, lon: 82 })).toEqual([
      { id: "way/2", name: "Museum", category: "sight", lat: 18, lon: 82, nearStop: "Stop" },
    ]);
  });
});