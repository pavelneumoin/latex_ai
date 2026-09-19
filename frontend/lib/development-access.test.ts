import {describe,it,expect} from "vitest";
import {isUnderDevelopment} from "./development-access";
import {developmentOnly} from "./development-route";
describe("unreleased features",()=>{
 it.each(["/create","/my/123","/api/worksheets","/api/checks/123/run","/api/generate","/cabinet/classes","/api/upload"])("blocks %s",p=>expect(isUnderDevelopment(p)).toBe(true));
 it.each(["/catalog","/materials","/api/download/file","/api/auth/callback/vkid","/api/billing/create-payment","/api/webhooks/yookassa","/cabinet/billing"])("keeps %s available",p=>expect(isUnderDevelopment(p)).toBe(false));
 it("never invokes disabled backend logic",async()=>{let invoked=false;const response=await developmentOnly(async()=>{invoked=true}) ();expect(response.status).toBe(403);expect(invoked).toBe(false)});
});
