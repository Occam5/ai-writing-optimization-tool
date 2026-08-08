"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthFormProps = { mode: "login" | "register" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const raw = await response.text();
      let data: { error?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        // Preserve a useful message when the hosting platform returns HTML.
      }
      if (!raw && !response.ok) throw new Error("The server returned an empty response. Check the deployment logs and database configuration.");
      if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>
        Email address
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          minLength={mode === "register" ? 8 : 1}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          required
        />
        {mode === "register" && <small>Use at least 8 characters.</small>}
      </label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button auth-submit" disabled={loading} type="submit">
        {loading ? <LoaderCircle className="spin" size={18} /> : null}
        {mode === "login" ? "Sign in" : "Create account"}
        {!loading && <ArrowRight size={17} />}
      </button>
    </form>
  );
}
