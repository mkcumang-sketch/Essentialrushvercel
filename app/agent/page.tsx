export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import AgentDashboardClient from "./AgentDashboardClient";

export default async function AgentPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/agent");
  }

  const role = (session.user as any)?.role;
  const allowedRoles = ["AGENT", "STAFF", "ADMIN", "SUPER_ADMIN"];

  if (!allowedRoles.includes(role)) {
    redirect("/"); // Unauthorized users redirected to storefront
  }

  await connectDB();

  return (
    <AgentDashboardClient
      user={{
        name: session.user?.name || "Agent",
        email: session.user?.email || "",
        role: role,
      }}
    />
  );
}