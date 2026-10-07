"use client";

// Навигация кабинета: сайдбар (desktop) + нижние табы (mobile).

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome,
  IconFile,
  IconLibrary,
  IconUsers,
  IconCheckSquare,
  IconChart,
  IconCard,
  IconSettings,
} from "@/app/_components/Icons";

const ITEMS = [
 { href: "/cabinet", label: "Обзор", icon: IconHome, exact: true },
 { href: "/cabinet/library", label: "Мои материалы", icon: IconLibrary },
 { href: "/cabinet/settings", label: "Настройки", icon: IconSettings },
];
const MOBILE_ITEMS = ITEMS;

function useActive() {
  const pathname = usePathname() || "";
  return (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

export function CabinetSidebar() {
  const isActive = useActive();
  return (
    <aside className="rl2-cab-side">
      {ITEMS.map(({ href, label, icon: Icon, exact }) => (
        <Link key={href} href={href} className={`rl2-cab-nav ${isActive(href, exact) ? "on" : ""}`}>
          <span className="ic">
            <Icon size={19} />
          </span>
          {label}
        </Link>
      ))}
    </aside>
  );
}

export function CabinetBottomNav() {
  const isActive = useActive();
  return (
    <nav className="rl2-bottomnav" aria-label="Кабинет">
      <div className="rl2-bottomnav-inner">
        {MOBILE_ITEMS.map(({ href, label, icon: Icon, exact }) => (
          <Link key={href} href={href} className={isActive(href, exact) ? "on" : ""}>
            <span className="ic">
              <Icon size={21} />
            </span>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
