import {beforeEach,describe,expect,it,vi} from "vitest";
import {getProductAccess,canDownloadAsset} from "./entitlements";
import {isCatalogAdmin} from "./catalog-admin";
import {prisma} from "./db";
vi.mock("./catalog-admin",()=>({isCatalogAdmin:vi.fn(()=>false)}));
vi.mock("./db",()=>({prisma:{user:{findUnique:vi.fn()},purchase:{findUnique:vi.fn(()=>null)},subscription:{findMany:vi.fn(()=>[])}}}));
beforeEach(()=>{vi.clearAllMocks();vi.mocked(isCatalogAdmin).mockResolvedValue(false);vi.mocked(prisma.user.findUnique).mockResolvedValue({status:"active",libraryAccessForever:true} as never);});
describe("lifetime library invitation",()=>{
 it.each(["math","informatics"])("covers existing and future %s kits at every tier without a subscription",async subject=>{
  for(const id of ["existing","future-kit"]){
   expect(await getProductAccess("teacher",{id,subject,isFree:false})).toEqual({maxTier:"source",via:"invitation",purchaseTier:null});
   expect(await canDownloadAsset("teacher",{id,subject,isFree:false},"source")).toBe(true);
  }
  expect(prisma.subscription.findMany).not.toHaveBeenCalled();
 });
 it.each(["banned","pending"])("revokes access when account is %s, including free files",async status=>{
  vi.mocked(prisma.user.findUnique).mockResolvedValue({status,libraryAccessForever:true} as never);
  expect((await getProductAccess("teacher",{id:"kit",subject:"math",isFree:true})).maxTier).toBeNull();
 });
 it("does not grant visitor or uninvited user access",async()=>{
  expect((await getProductAccess(null,{id:"kit",subject:"math",isFree:false})).maxTier).toBeNull();
  vi.mocked(prisma.user.findUnique).mockResolvedValue({status:"active",libraryAccessForever:false} as never);
  expect((await getProductAccess("teacher",{id:"kit",subject:"math",isFree:false})).maxTier).toBeNull();
 });
 it("preserves the separate owner role",async()=>{
  vi.mocked(isCatalogAdmin).mockResolvedValue(true);
  expect((await getProductAccess("owner",{id:"kit",subject:"math",isFree:false})).via).toBe("admin");
 });
});
