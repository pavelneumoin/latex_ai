"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "../_components/Header";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [password2, setPassword2] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setErr(null);

    if (password.length < 6) {
      setErr("Пароль должен быть не короче 6 символов");
      return;
    }
    if (password !== password2) {
      setErr("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      if (!r.ok) {
        const data: { error?: string } = await r.json().catch(() => ({}));
        if (data.error === "email_taken") {
          setErr("Этот email уже зарегистрирован");
        } else {
          setErr("Не удалось зарегистрироваться. Проверьте поля.");
        }
        return;
      }
      const signRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signRes?.error) {
        setErr("Регистрация прошла, но автовход не сработал. Войдите вручную.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErr("Что-то пошло не так. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main style={{ display: "grid", placeItems: "center", padding: "64px 24px" }}>
        <div className="card" style={{ width: "100%", maxWidth: 420, padding: 32 }}>
          <h1 style={{ marginBottom: 6 }}>Регистрация</h1>
          <p className="muted" style={{ marginBottom: 24, fontSize: 14 }}>
            Создайте аккаунт — получите бесплатный план Free.
          </p>

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="label" htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ivan@example.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="name">Имя (необязательно)</label>
              <input
                id="name"
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иван Петров"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Пароль *</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="не менее 6 символов"
              />
            </div>
            <div>
              <label className="label" htmlFor="password2">Повторите пароль *</label>
              <input
                id="password2"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="input"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
            </div>

            {err && (
              <div
                style={{
                  padding: "10px 12px",
                  background: "#FEE2E2",
                  color: "#991B1B",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                {err}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-blue btn-lg"
              disabled={loading}
              style={{ width: "100%", marginTop: 6 }}
            >
              {loading ? "Создаём аккаунт..." : "Создать аккаунт"}
            </button>
          </form>

          <div style={{ marginTop: 18, fontSize: 14, color: "var(--fg-2)", textAlign: "center" }}>
            Уже есть аккаунт?{" "}
            <Link href="/login" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
              Войти
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
