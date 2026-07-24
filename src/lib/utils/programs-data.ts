import { createClient } from "@/lib/supabase/client";
import { PROGRAM_DEFINITIONS, ProgramDefinition } from "@/lib/constants/programs";

/**
 * Loads the active programs from the DB (source of truth). Falls back to the
 * static PROGRAM_DEFINITIONS if the table is empty or unreachable, so the app
 * keeps working even before the migration is applied.
 */
export async function getProgramsClient(): Promise<ProgramDefinition[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("programs")
      .select("key, label, icon, eligibility_class, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) return PROGRAM_DEFINITIONS;

    return data.map((p: any) => ({
      id: p.key,
      label: p.label,
      icon: p.icon,
      eligibility_class: p.eligibility_class,
    }));
  } catch {
    return PROGRAM_DEFINITIONS;
  }
}
