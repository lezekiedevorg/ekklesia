import { redirect } from "next/navigation";

// Stats are merged into the Command Center (Comparaison / Évolution tabs).
export default function StatsRedirect() {
  redirect("/admin/super-dashboard");
}
