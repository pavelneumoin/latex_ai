import type { OAuthConfig } from "next-auth/providers/oauth";

interface VKProfile { user_id: string; first_name?:string; last_name?:string; avatar?:string; email?:string }
export function createVKIDProvider(deviceId?:string):OAuthConfig<VKProfile>{
 const clientId=process.env.VK_ID_CLIENT_ID!;
 return {
  id:"vkid",name:"VK ID",type:"oauth",clientId,clientSecret:process.env.VK_ID_CLIENT_SECRET,
  client:{token_endpoint_auth_method:"none"},checks:["pkce","state"],
  authorization:{url:"https://id.vk.com/authorize",params:{scope:"email",response_type:"code"}},
  token:{url:"https://id.vk.com/oauth2/auth",async request({params,checks,provider}){
   if(!params.state||!checks.state||params.state!==checks.state)throw new Error("VK ID state mismatch");
   if(!params.code||!checks.code_verifier||!deviceId||deviceId.length>2048)throw new Error("VK ID incomplete callback");
   const body=new URLSearchParams({grant_type:"authorization_code",client_id:clientId,code:params.code,code_verifier:checks.code_verifier,device_id:deviceId,redirect_uri:provider.callbackUrl,state:params.state});
   if(process.env.VK_ID_CLIENT_SECRET)body.set("client_secret",process.env.VK_ID_CLIENT_SECRET);
   const res=await fetch("https://id.vk.com/oauth2/auth",{method:"POST",body,signal:AbortSignal.timeout(15000),cache:"no-store"});
   const data=await res.json();
   if(!res.ok||data.error||typeof data.access_token!=="string"||data.state!==params.state)throw new Error("VK ID token exchange failed");
   return {tokens:{access_token:data.access_token,token_type:data.token_type??"bearer",expires_in:typeof data.expires_in==="number"?data.expires_in:3600,scope:typeof data.scope==="string"?data.scope:""}};
  }},
  userinfo:{url:"https://id.vk.com/oauth2/user_info",async request({tokens}){
   const res=await fetch("https://id.vk.com/oauth2/user_info",{method:"POST",body:new URLSearchParams({client_id:clientId,access_token:tokens.access_token!}),signal:AbortSignal.timeout(15000),cache:"no-store"});
   const data=await res.json();
   if(!res.ok||data.error||!data.user?.user_id)throw new Error("VK ID profile unavailable");
   return data.user;
  }},
  profile(profile){
   const id=String(profile.user_id);
   if(!/^\d+$/.test(id))throw new Error("VK ID invalid user id");
   // VK identity is keyed by providerAccountId. Never merge accounts by an unverified email.
   return {id,name:[profile.first_name,profile.last_name].filter(Boolean).join(" ")||"Учитель",image:profile.avatar??null,email:`vk-${id}@vk-id.invalid`};
  },
 };
}
