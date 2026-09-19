import {afterEach,describe,it,expect,vi} from "vitest";
import {createVKIDProvider} from "./auth-vkid";
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()});
describe("VK ID OAuth",()=>{
 it("rejects forged state before contacting VK",async()=>{
  vi.stubEnv("VK_ID_CLIENT_ID","123");const request=vi.fn();vi.stubGlobal("fetch",request);
  const provider=createVKIDProvider("device");const endpoint=provider.token as {request:Function};
  await expect(endpoint.request({params:{state:"forged",code:"code"},checks:{state:"expected",code_verifier:"secret"},provider:{callbackUrl:"http://localhost/callback"}})).rejects.toThrow("state mismatch");
  expect(request).not.toHaveBeenCalled();
 });
 it("requires the device id and PKCE verifier",async()=>{
  const request=vi.fn();vi.stubGlobal("fetch",request);const endpoint=createVKIDProvider().token as {request:Function};
  await expect(endpoint.request({params:{state:"same",code:"code"},checks:{state:"same"},provider:{}})).rejects.toThrow("incomplete callback");expect(request).not.toHaveBeenCalled();
 });
 it("rejects a token response with a different state",async()=>{
  vi.stubEnv("VK_ID_CLIENT_ID","123");vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>({access_token:"token",state:"different"})}));
  const endpoint=createVKIDProvider("device").token as {request:Function};
  await expect(endpoint.request({params:{state:"same",code:"code"},checks:{state:"same",code_verifier:"verifier"},provider:{callbackUrl:"http://localhost/callback"}})).rejects.toThrow("token exchange failed");
 });
 it("keys identity by VK id without merging by email",async()=>{
  const profile=await createVKIDProvider().profile({user_id:"123",first_name:"Иван",email:"existing@example.com"},{});
  expect(profile.id).toBe("123");expect(profile.email).toBe("vk-123@vk-id.invalid");
 });
});
