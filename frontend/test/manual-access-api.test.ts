import {describe,expect,it,vi} from "vitest";
import {NextRequest} from "next/server";
import {POST as register} from "@/app/api/auth/register/route";
import {POST as createPayment} from "@/app/api/billing/create-payment/route";
import {POST as paymentWebhook} from "@/app/api/webhooks/yookassa/route";
import {getPayments} from "@/lib/payments";
vi.mock("@/lib/payments",()=>({getPayments:vi.fn()}));
vi.mock("@/lib/session",()=>({requireUser:vi.fn(()=>{throw new Error("No session should be required for a closed endpoint");})}));
describe("manual library account mode",()=>{
 it("does not expose public account creation",async()=>{
  const response=await register();
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"accounts_issued_by_administrator"});
 });
 it("never starts a payment or processes a callback",async()=>{
  const request=new NextRequest("http://localhost/api/billing/create-payment",{method:"POST",body:"{}"});
  expect((await createPayment(request)).status).toBe(403);
  expect((await paymentWebhook(request)).status).toBe(503);
  expect(getPayments).not.toHaveBeenCalled();
 });
});
