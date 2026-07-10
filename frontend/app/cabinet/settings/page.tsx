import { redirect } from "next/navigation";

// Настройки профиля уже реализованы на /settings — кабинет ссылается туда.
export default function CabinetSettingsRedirect() {
  redirect("/settings");
}
