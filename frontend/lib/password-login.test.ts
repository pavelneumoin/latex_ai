import {beforeEach,describe,expect,it,vi} from "vitest";
import bcrypt from "bcryptjs";
import {authenticatePassword} from "./password-login";
import {prisma} from "./db";
import {checkRate} from "./rate-limit";
vi.mock("./db",()=>({prisma:{user:{findUnique:vi.fn()}}}));
vi.mock("./rate-limit",()=>({checkRate:vi.fn(()=>({ok:true}))}));
const account={id:"teacher",username:"teacher.one",email:null,name:"Учитель",image:null,passwordHash:bcrypt.hashSync("valid-password",4),status:"active"};
beforeEach(()=>{vi.clearAllMocks();vi.mocked(prisma.user.findUnique).mockResolvedValue(account as never);vi.mocked(checkRate).mockReturnValue({ok:true} as never);});
describe("issued account login",()=>{
 it("accepts a normalized username with no email and never returns its hash",async()=>{
  expect(await authenticatePassword({username:" Teacher.One ",password:"valid-password"})).toEqual({id:"teacher",email:null,name:"Учитель",image:null});
  expect(prisma.user.findUnique).toHaveBeenCalledWith({where:{username:"teacher.one"}});
 });
 it("preserves email logins for existing owners",async()=>{
  expect(await authenticatePassword({username:"Owner@Local.Test",password:"valid-password"})).not.toBeNull();
  expect(prisma.user.findUnique).toHaveBeenCalledWith({where:{email:"owner@local.test"}});
 });
 it.each(["pending","banned"])("rejects %s accounts",async status=>{
  vi.mocked(prisma.user.findUnique).mockResolvedValue({...account,status} as never);
  expect(await authenticatePassword({username:"teacher.one",password:"valid-password"})).toBeNull();
 });
 it("rejects wrong passwords, missing accounts and invalid credentials",async()=>{
  expect(await authenticatePassword({username:"teacher.one",password:"wrong-password"})).toBeNull();
  vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
  expect(await authenticatePassword({username:"missing",password:"valid-password"})).toBeNull();
  expect(await authenticatePassword({username:"",password:""})).toBeNull();
 });
 it("limits repeated login attempts before querying accounts",async()=>{
  vi.mocked(checkRate).mockReturnValue({ok:false} as never);
  expect(await authenticatePassword({username:"teacher.one",password:"valid-password"})).toBeNull();
  expect(prisma.user.findUnique).not.toHaveBeenCalled();
 });
});
