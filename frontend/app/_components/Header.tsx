"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Brand } from "./Brand";
import { IconLibrary, IconX } from "./Icons";
import { schoolOrigin } from "@/lib/school-link";
const links = [["/catalog", "Материалы"], ["/materials", "Навигатор ЕГЭ"], ["/access", "Как получить доступ"]];
export function Header() {
 const path = usePathname();
 const { data: session, status } = useSession();
 const [open, setOpen] = useState(false);
 useEffect(() => setOpen(false), [path]);
 useEffect(() => { const close = (e: KeyboardEvent) => { if(e.key === "Escape") setOpen(false); }; document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, []);
 const active = (href: string) => href === "/catalog" ? path === "/" || path.startsWith("/catalog") : path.startsWith(href);
 return <header className="site-header"><Link href="/" className="site-brand"><span className="brand-mark"><IconLibrary size={22} /></span><Brand /></Link><nav className="site-nav" aria-label="Главное меню"><a className="school-back-link" href={schoolOrigin()}>Ученикам ↗</a>{links.map(([href,label]) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}>{label}</Link>)}</nav><div className="site-account">{status === "loading" ? <span className="account-loading">Вход…</span> : session?.user ? <><Link href="/cabinet" className="account-button">Мой кабинет</Link><button onClick={() => signOut({callbackUrl:"/"})}>Выйти</button></> : <><Link href="/login" className="account-button">Войти в кабинет</Link></>}</div><button className="mobile-menu-button" aria-label={open ? "Закрыть меню" : "Открыть меню"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <IconX size={22} /> : <span>☰</span>}</button>{open && <nav id="mobile-navigation" className="mobile-navigation" aria-label="Меню на телефоне"><a href={schoolOrigin()}>Ученикам ↗</a><a href={`${schoolOrigin()}/teachers`}>Неумошка учителям</a>{links.map(([href,label])=><Link key={href} href={href} aria-current={active(href) ? "page" : undefined}>{label}</Link>)}<Link href={session?.user ? "/cabinet" : "/login"}>{session?.user ? "Мой кабинет" : "Войти в кабинет"}</Link></nav>}</header>;
}
