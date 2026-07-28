import type { Metadata } from "next";
import { Header } from "../_components/Header";
import { MaterialsNavigator } from "./MaterialsNavigator";

export const metadata: Metadata = {
  title: "Темы ЕГЭ по профильной математике — РабочийЛист.ai",
  description:
    "Навигатор по 19 заданиям и 95 подтемам профильной математики ЕГЭ с поиском и отметками прогресса.",
};

export default function MaterialsPage() {
  return (
    <div
      className="hi"
      style={{
        minHeight: "100vh",
        background: "var(--surface)",
        color: "var(--fg)",
      }}
    >
      <Header />
      <main
        className="rl-container rl-container-wide"
        style={{ paddingTop: 24, paddingBottom: 72 }}
      >
        <MaterialsNavigator />
      </main>
    </div>
  );
}
