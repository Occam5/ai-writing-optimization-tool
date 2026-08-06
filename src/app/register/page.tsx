import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { getSession } from "@/lib/session";

export default async function RegisterPage() {
  if (await getSession()) redirect("/dashboard");
  return <AuthShell mode="register" />;
}
