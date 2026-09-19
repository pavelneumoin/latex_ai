import {describe,it,expect} from "vitest";
import {subscriptionPeriodEnd} from "./subscription-period";
describe("paid subscription period",()=>{
 it("grants one calendar month",()=>expect(subscriptionPeriodEnd(new Date("2026-09-19T12:00:00Z"),null).toISOString()).toBe("2026-10-19T12:00:00.000Z"));
 it("preserves remaining paid days",()=>expect(subscriptionPeriodEnd(new Date("2026-09-19T12:00:00Z"),new Date("2026-10-03T12:00:00Z")).toISOString()).toBe("2026-11-03T12:00:00.000Z"));
 it("clamps January 31 to February 28",()=>expect(subscriptionPeriodEnd(new Date("2026-01-31T12:00:00Z"),null).toISOString()).toBe("2026-02-28T12:00:00.000Z"));
 it("restarts an expired subscription from payment",()=>expect(subscriptionPeriodEnd(new Date("2026-09-19T12:00:00Z"),new Date("2026-08-01T00:00:00Z")).toISOString()).toBe("2026-10-19T12:00:00.000Z"));
 it("handles a month in a leap year",()=>expect(subscriptionPeriodEnd(new Date("2024-01-31T12:00:00Z"),null).toISOString()).toBe("2024-02-29T12:00:00.000Z"));
});
