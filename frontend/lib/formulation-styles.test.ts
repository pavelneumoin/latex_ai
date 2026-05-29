import { describe, expect, it } from "vitest";
import {
  isFormulationStyle,
  getStyleSpec,
  temperatureForStyle,
  buildContextDirective,
  listStylesForUi,
  DEFAULT_FORMULATION_STYLE,
} from "./formulation-styles";

const ALL_STYLES = ["mixed", "formal", "friendly", "practical", "playful", "olympiad"];

describe("isFormulationStyle", () => {
  it("accepts all known styles", () => {
    for (const s of ALL_STYLES) expect(isFormulationStyle(s)).toBe(true);
  });
  it("rejects unknown / non-string", () => {
    expect(isFormulationStyle("classic")).toBe(false); // old name, no longer valid
    expect(isFormulationStyle("nope")).toBe(false);
    expect(isFormulationStyle(undefined)).toBe(false);
    expect(isFormulationStyle(42)).toBe(false);
    expect(isFormulationStyle(null)).toBe(false);
  });
});

describe("getStyleSpec", () => {
  it("returns the matching spec", () => {
    expect(getStyleSpec("practical").id).toBe("practical");
    expect(getStyleSpec("playful").label).toBe("Игровой");
  });
  it("falls back to default for invalid input", () => {
    expect(getStyleSpec("garbage").id).toBe(DEFAULT_FORMULATION_STYLE);
    expect(getStyleSpec(undefined).id).toBe(DEFAULT_FORMULATION_STYLE);
  });
  it("default is mixed", () => {
    expect(DEFAULT_FORMULATION_STYLE).toBe("mixed");
  });
});

describe("temperatureForStyle", () => {
  it("formal is the most deterministic, playful the most creative", () => {
    expect(temperatureForStyle("formal")).toBeLessThan(temperatureForStyle("mixed"));
    expect(temperatureForStyle("mixed")).toBeLessThanOrEqual(temperatureForStyle("playful"));
    expect(temperatureForStyle("formal")).toBeLessThan(temperatureForStyle("playful"));
  });
  it("all temperatures within sane 0..1 bounds", () => {
    for (const s of ALL_STYLES) {
      const t = temperatureForStyle(s);
      expect(t).toBeGreaterThan(0);
      expect(t).toBeLessThanOrEqual(1);
    }
  });
  it("invalid style uses default temperature", () => {
    expect(temperatureForStyle("xxx")).toBe(temperatureForStyle(DEFAULT_FORMULATION_STYLE));
  });
});

describe("buildContextDirective", () => {
  it("weaves in the context theme when provided", () => {
    const d = buildContextDirective("космос");
    expect(d).toContain("космос");
    expect(d).toContain("антураж");
  });
  it("returns empty string for blank / whitespace / null / undefined", () => {
    expect(buildContextDirective("")).toBe("");
    expect(buildContextDirective("   ")).toBe("");
    expect(buildContextDirective(null)).toBe("");
    expect(buildContextDirective(undefined)).toBe("");
  });
  it("trims the theme", () => {
    const d = buildContextDirective("  футбол  ");
    expect(d).toContain("«футбол»");
  });
});

describe("listStylesForUi", () => {
  it("returns all six styles with id+label+short and no temperature leak", () => {
    const list = listStylesForUi();
    expect(list).toHaveLength(6);
    const ids = list.map((s) => s.id).sort();
    expect(ids).toEqual([...ALL_STYLES].sort());
    for (const item of list) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("label");
      expect(item).toHaveProperty("short");
      expect(item).not.toHaveProperty("temperature");
    }
  });
});
