import { Member, Attendance, ProgramSummaryItem } from "@/types/db";
import { PROGRAM_DEFINITIONS, ProgramDefinition } from "@/lib/constants/programs";

/**
 * Computes attendance summary across the given programs for a set of members.
 * Eligibility for class-type programs is driven by `program.eligibility_class`
 * matched against `member.current_class`.
 *
 * `programs` defaults to the static fallback list; pass the DB-loaded list
 * (from getProgramsClient/getProgramsServer) for the configurable set.
 */
export function computeProgramsSummary(
  members: Member[],
  attendanceRecords: Attendance[],
  programs: ProgramDefinition[] = PROGRAM_DEFINITIONS
): ProgramSummaryItem[] {
  // Exclude archived AND newcomers (status='new') from member quotas
  // Newcomers are tracked separately for integration, not counted in official ratios
  const activeMembers = members.filter((m) => !m.archived_at && m.status !== "archived" && m.status !== "new");

  return programs.map((prog) => {
    let eligibleMembers = activeMembers;
    if (prog.eligibility_class) {
      eligibleMembers = activeMembers.filter((m) => m.current_class === prog.eligibility_class);
    }

    const eligibleCount = eligibleMembers.length;
    const eligibleIds = new Set(eligibleMembers.map((m) => m.id));
    const presentIdsForProg = new Set(
      attendanceRecords
        .filter((a) => a.program_type === prog.id && a.is_present && eligibleIds.has(a.member_id))
        .map((a) => a.member_id)
    );

    const presentCount = presentIdsForProg.size;
    const ratio = eligibleCount > 0 ? Math.round((presentCount / eligibleCount) * 100) : 0;

    return {
      program_type: prog.id,
      label: prog.label,
      icon: prog.icon,
      present_count: presentCount,
      eligible_count: eligibleCount,
      ratio_pct: ratio,
    };
  });
}
