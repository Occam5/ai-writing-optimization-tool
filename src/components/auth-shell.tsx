import Link from "next/link";
import { AuthForm } from "./auth-form";

export function AuthShell({ mode }: { mode: "login" | "register" }) {
  const login = mode === "login";
  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/">
        <span className="brand-mark">L2</span><span>L2Write</span>
      </Link>
      <section className="auth-card">
        <p className="eyebrow"><span /> Academic writing workspace</p>
        <h1>{login ? "Welcome back." : "Start writing better."}</h1>
        <p className="auth-intro">
          {login
            ? "Sign in to continue improving your academic writing."
            : "Create your free account and get five complete analyses every day."}
        </p>
        <AuthForm mode={mode} />
        <p className="auth-switch">
          {login ? "New to L2Write?" : "Already have an account?"}{" "}
          <Link href={login ? "/register" : "/login"}>
            {login ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </section>
      <p className="auth-footnote">Your writing remains private to your account.</p>
    </main>
  );
}
