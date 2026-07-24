import { redirect } from "next/navigation";

// Evolution is merged into the Command Center (Évolution tab).
export default function EvolutionRedirect() {
  redirect("/admin/super-dashboard");
}
