"use client";
import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
export function VKLoginButton(){
 const [ready,setReady]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 useEffect(()=>{getProviders().then(p=>setReady(!!p?.vkid)).catch(()=>setError("Не удалось загрузить способы входа"));},[]);
 async function login(){setBusy(true);setError("");const params=new URLSearchParams(window.location.search);const requested=params.get("callbackUrl")||"/cabinet";let callbackUrl="/cabinet";try{const url=new URL(requested,window.location.origin);if(url.origin===window.location.origin)callbackUrl=url.pathname+url.search;}catch{}try{await signIn("vkid",{callbackUrl});}catch{setError("Не удалось открыть VK ID. Попробуйте ещё раз.");setBusy(false)}}
 return <div className="vk-signin"><button type="button" disabled={!ready||busy} onClick={login}><b>VK</b>{busy?"Открываем VK ID…":"Войти через VK ID"}</button>{!ready&&<small>Вход через VK скоро появится. Пока можно войти по почте.</small>}{error&&<p role="alert">{error}</p>}<div className="auth-divider">или по электронной почте</div></div>;
}
