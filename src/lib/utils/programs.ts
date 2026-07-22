import { Member, Attendance, ProgramSummaryItem } from "@/types/db";
import { PROGRAM_DEFINITIONS } from "@/lib/constants/programs";

/**
 * Computes attendance summary across all 5 programs for a set of members.
 * Strictly uses member.current_class to determine eligibility for Tuesday and Wednesday classes.
 */
export function computeProgramsSummary(
  members: Member[],
  attendanceRecords: Attendance[]
): ProgramSummaryItem[] {
  const activeMembers = members.filter((m) => !m.archived_at && m.status !== "archived");

  return PROGRAM_DEFINITIONS.map((prog) => {
    let eligibleMembers = activeMembers;
    if (prog.id === "tuesday_class") {
      eligibleMembers = activeMembers.filter((m) => m.current_class === "tuesday_class");
    } else if (prog.id === "wednesday_class") {
      eligibleMembers = activeMembers.filter((m) => m.current_class === "wednesday_class");
    }

    const eligibleCount = eligibleMembers.length;
    const presentIdsForProg = new Set(
      attendanceRecords
        .filter((a) => a.program_type === prog.id && a.is_present)
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
