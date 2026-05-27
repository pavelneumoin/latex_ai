"use client";

import { Suspense, useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "../_components/Header";

// Next.js требует, чтобы useSearchParams() был обёрнут в Suspense на странице,
// которая может рендериться статически. Вынесли реальную форму в отдельный компонент.
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginShell() {
  return (
    <div className="hi" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <Header />
      <main style={{ display: "grid", placeItems: "center", padding: "64px 24px" }}>
        <div className="card" style={{ width: "100%", maxWidth: 400, padding: 32 }}>
          <h1 style={{ marginBottom: 6 }}>Вход в кабинет</h1>
          <p className="muted" style={{ fontSize: 14 }}>Загрузка...</p>
        </div>
      </main>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!res) {
        setErr("Не удалось связаться с сервером");
        return;
      }
      if (res.error) {
        setErr("Неверный email или пароль");
        return;
      }
      router.push(callbackUrl);
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
      <main
        style={{
          display: "grid",
          placeItems: "center",
          padding: "64px 24px",
        }}
      >
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: 400,
            padding: 32,
          }}
        >
          <h1 style={{ marginBottom: 6 }}>Вход в кабинет</h1>
          <p className="muted" style={{ marginBottom: 24, fontSize: 14 }}>
            Войдите, чтобы открыть свои рабочие листы.
          </p>

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="label" htmlFor="email">Email</label>
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
              <label className="label" htmlFor="password">Пароль</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="не менее 6 символов"
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
              {loading ? "Входим..." : "Войти"}
            </button>
          </form>

          <div style={{ marginTop: 18, fontSize: 14, color: "var(--fg-2)", textAlign: "center" }}>
            Нет аккаунта?{" "}
            <Link href="/register" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
