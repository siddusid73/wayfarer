import { describe, it, expect, beforeEach } from "vitest";
import { moveItem, saveTrip, loadTrips, deleteTrip, getTrip } from "./trips";

const p = (n: string) => ({ id: n, name: n, detail: "", lat: 0, lon: 0 });

describe("trips", () => {
  beforeEach(() => localStorage.clear());
  it("reorders stops", () => {
    expect(moveItem(["a", "b", "c"], 2, 1)).toEqual(["a", "c", "b"]);
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
  });
  it("saves, reopens and deletes a trip", () => {
    saveTrip({ id: "x", title: "Coast", stops: [p("A"), p("B")], updatedAt: 0 });
    expect(getTrip("x")?.title).toBe("Coast");
    saveTrip({ id: "x", title: "Coast 2", stops: [p("A")], updatedAt: 0 });
    expect(loadTrips()).toHaveLength(1);
    deleteTrip("x");
    expect(loadTrips()).toHaveLength(0);
  });
});
