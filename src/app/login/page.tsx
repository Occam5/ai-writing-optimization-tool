import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { getSession } from "@/lib/session";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");
  return <AuthShell mode="login" />;
}
