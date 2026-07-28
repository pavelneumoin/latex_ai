import { afterEach, describe, expect, it, vi } from "vitest";
import { getLLMCapabilities, getProvider } from "./index";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getLLMCapabilities", () => {
  it("keeps mock available explicitly but never marks it ready for user generation", async () => {
    vi.stubEnv("LLM_PROVIDER", "mock");

    const capabilities = getLLMCapabilities();
    expect(capabilities).toEqual({
      provider: "mock",
      model: "mock-1",
      ready: false,
      vision: false,
    });

    const response = await getProvider("mock").generate({
      messages: [{ role: "user", content: "demo" }],
      jsonSchema: {},
    });
    expect(response.provider).toBe("mock");
  });

  it("reports a known provider without credentials as unavailable", async () => {
    vi.stubEnv("LLM_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "");

    expect(getLLMCapabilities()).toMatchObject({
      provider: "openai",
      ready: false,
      vision: true,
    });
    expect(getProvider().name).toBe("openai");
    await expect(
      getProvider().generate({ messages: [{ role: "user", content: "test" }] })
    ).rejects.toThrow("openai_not_configured");
  });

  it("reports a configured live provider as ready", () => {
    vi.stubEnv("LLM_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "test-key");

    expect(getLLMCapabilities()).toMatchObject({
      provider: "openai",
      ready: true,
      vision: true,
    });
  });

  it("does not silently fall back to mock for an unknown provider", () => {
    vi.stubEnv("LLM_PROVIDER", "typo");

    expect(getLLMCapabilities()).toEqual({
      provider: "typo",
      model: "",
      ready: false,
      vision: false,
    });
    expect(() => getProvider()).toThrow("llm_provider_unknown:typo");
  });
});
