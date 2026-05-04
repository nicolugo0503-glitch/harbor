import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardApp from "./app";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <DashboardApp email={session.email} />;
}
