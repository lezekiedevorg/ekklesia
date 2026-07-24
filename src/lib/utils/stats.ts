import { createClient } from "@/lib/supabase/server";
import { PROGRAM_DEFINITIONS } from "@/lib/constants/programs";

export interface Period {
  start: string;
  end: string;
}

export interface GlobalStats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisPeriod: number;
  totalShepherds: number;
  totalGroups: number;
  totalDepartments: number;
  attendanceByProgram: Record<string, number>;
  disciplineScores: {
    prayer: number;
    meditation: number;
    evangelism: number;
    fasting: number;
  };
  reportSubmissionRate: number;
  alertCount: number;
}

export interface ShepherdStats {
  memberCount: number;
  attendanceRatios: Record<string, number>;
  disciplineScores: {
    prayer: number;
    meditation: number;
    evangelism: number;
    fasting: number;
  };
  soulsWon: number;
  visitsCount: number;
  callsCount: number;
  reportStatus: string;
  score: number;
}

export interface DepartmentStats {
  memberCount: number;
  memberNames: string[];
  newcomerRegistrations: number;
}

export interface AttendanceTrendPoint {
  period: string;
  programs: Record<string, number>;
}

export interface EntityComparison {
  entityId: string;
  entityName: string;
  entityType: "group" | "shepherd" | "department";
  metrics: Record<string, number>;
}

function getDefaultWeights(): Record<string, number> {
  return {
    attendance: 30,
    discipline: 25,
    evangelism: 20,
    reports: 15,
    pastoral_care: 10,
  };
}

function normalizeToStars(value: number): number {
  if (value >= 90) return 5;
  if (value >= 75) return 4;
  if (value >= 60) return 3;
  if (value >= 40) return 2;
  return 1;
}

function getWeekRange(dateStr: string): { monday: string; sunday: string } {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    monday: monday.toISOString().split("T")[0],
    sunday: sunday.toISOString().split("T")[0],
  };
}

export async function getGlobalStats(period?: Period): Promise<GlobalStats> {
  const supabase = await createClient();

  const now = new Date();
  const defaultPeriod: Period = {
    start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: now.toISOString().split("T")[0],
  };
  const p = period || defaultPeriod;

  const [membersRes, shepherdsRes, groupsRes, deptsRes, attendanceRes, activitiesRes, reportsRes, alertsRes, newMembersRes] =
    await Promise.all([
      supabase.from("members").select("id, status", { count: "exact" }).is("archived_at", null),
      supabase.from("profiles").select("id", { count: "exact" }).eq("role", "shepherd"),
      supabase.from("groups").select("id", { count: "exact" }),
      supabase.from("departments").select("id", { count: "exact" }).eq("is_active", true),
      supabase.from("attendance").select("member_id, program_type, is_present").gte("date", p.start).lte("date", p.end),
      supabase.from("shepherd_activities").select("*").gte("week_start_date", p.start).lte("week_start_date", p.end),
      supabase.from("weekly_reports").select("id, status").gte("report_date", p.start).lte("report_date", p.end),
      supabase.from("members").select("id").is("archived_at", null).or("consecutive_absences.gte.2,status.eq.absent_to_relaunch"),
      supabase.from("members").select("id", { count: "exact" }).is("archived_at", null).gte("created_at", p.start).lte("created_at", p.end),
    ]);

  const totalMembers = membersRes.count || 0;
  const activeMembers = (membersRes.data || []).filter((m) => m.status !== "archived").length;
  const newMembersThisPeriod = newMembersRes.count || 0;
  const totalShepherds = shepherdsRes.count || 0;
  const totalGroups = groupsRes.count || 0;
  const totalDepartments = deptsRes.count || 0;

  // Attendance by program
  const attendanceByProgram: Record<string, number> = {};
  const programs = PROGRAM_DEFINITIONS.map((p) => p.id);
  for (const prog of programs) {
    const progAttendance = (attendanceRes.data || []).filter((a) => a.program_type === prog);
    const present = progAttendance.filter((a) => a.is_present).length;
    attendanceByProgram[prog] = progAttendance.length > 0 ? Math.round((present / progAttendance.length) * 100) : 0;
  }

  // Discipline scores
  const activities = activitiesRes.data || [];
  const disciplineScores = {
    prayer: activities.length > 0 ? Math.round((activities.filter((a) => a.prayer_q_done || a.daily_prayer_done).length / activities.length) * 100) : 0,
    meditation: activities.length > 0 ? Math.round((activities.filter((a) => a.daily_meditation_done || a.bible_study_q_done).length / activities.length) * 100) : 0,
    evangelism: activities.length > 0 ? Math.round((activities.filter((a) => a.evangelization_done || a.evangelism_q_done).length / activities.length) * 100) : 0,
    fasting: activities.length > 0 ? Math.round((activities.filter((a) => a.fasting_q_done).length / activities.length) * 100) : 0,
  };

  // Report submission rate
  const reports = reportsRes.data || [];
  const reportSubmissionRate = totalShepherds > 0 ? Math.round((reports.length / totalShepherds) * 100) : 0;

  // Alert count
  const alertCount = (alertsRes.data || []).length;

  return {
    totalMembers,
    activeMembers,
    newMembersThisPeriod,
    totalShepherds,
    totalGroups,
    totalDepartments,
    attendanceByProgram,
    disciplineScores,
    reportSubmissionRate,
    alertCount,
  };
}

export async function getGroupStats(groupId: string, period?: Period): Promise<GlobalStats> {
  const supabase = await createClient();

  const now = new Date();
  const defaultPeriod: Period = {
    start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: now.toISOString().split("T")[0],
  };
  const p = period || defaultPeriod;

  // Get shepherds in this group
  const { data: groupShepherds } = await supabase
    .from("profiles")
    .select("id")
    .eq("group_id", groupId)
    .eq("role", "shepherd");

  const shepherdIds = (groupShepherds || []).map((s) => s.id);

  const [membersRes, attendanceRes, activitiesRes, reportsRes] = await Promise.all([
    supabase.from("members").select("id, status").is("archived_at", null).in("shepherd_id", shepherdIds),
    supabase.from("attendance").select("member_id, program_type, is_present").gte("date", p.start).lte("date", p.end).in("member_id", (await supabase.from("members").select("id").is("archived_at", null).in("shepherd_id", shepherdIds)).data?.map((m) => m.id) || []),
    supabase.from("shepherd_activities").select("*").in("shepherd_id", shepherdIds).gte("week_start_date", p.start).lte("week_start_date", p.end),
    supabase.from("weekly_reports").select("id, status").in("shepherd_id", shepherdIds).gte("report_date", p.start).lte("report_date", p.end),
  ]);

  const totalMembers = membersRes.count || 0;
  const attendanceByProgram: Record<string, number> = {};
  const programs = PROGRAM_DEFINITIONS.map((pr) => pr.id);
  for (const prog of programs) {
    const progAttendance = (attendanceRes.data || []).filter((a) => a.program_type === prog);
    const present = progAttendance.filter((a) => a.is_present).length;
    attendanceByProgram[prog] = progAttendance.length > 0 ? Math.round((present / progAttendance.length) * 100) : 0;
  }

  const activities = activitiesRes.data || [];
  const disciplineScores = {
    prayer: activities.length > 0 ? Math.round((activities.filter((a) => a.prayer_q_done || a.daily_prayer_done).length / activities.length) * 100) : 0,
    meditation: activities.length > 0 ? Math.round((activities.filter((a) => a.daily_meditation_done || a.bible_study_q_done).length / activities.length) * 100) : 0,
    evangelism: activities.length > 0 ? Math.round((activities.filter((a) => a.evangelization_done || a.evangelism_q_done).length / activities.length) * 100) : 0,
    fasting: activities.length > 0 ? Math.round((activities.filter((a) => a.fasting_q_done).length / activities.length) * 100) : 0,
  };

  return {
    totalMembers,
    activeMembers: totalMembers,
    newMembersThisPeriod: 0,
    totalShepherds: shepherdIds.length,
    totalGroups: 1,
    totalDepartments: 0,
    attendanceByProgram,
    disciplineScores,
    reportSubmissionRate: shepherdIds.length > 0 ? Math.round((reportsRes.data?.length || 0) / shepherdIds.length * 100) : 0,
    alertCount: 0,
  };
}

export async function getShepherdStats(shepherdId: string, period?: Period): Promise<ShepherdStats> {
  const supabase = await createClient();

  const now = new Date();
  const defaultPeriod: Period = {
    start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: now.toISOString().split("T")[0],
  };
  const p = period || defaultPeriod;

  const [membersRes, attendanceRes, activitiesRes, reportsRes, visitsRes] = await Promise.all([
    supabase.from("members").select("id").eq("shepherd_id", shepherdId).is("archived_at", null),
    supabase.from("attendance").select("member_id, program_type, is_present").gte("date", p.start).lte("date", p.end).in("member_id", (await supabase.from("members").select("id").eq("shepherd_id", shepherdId).is("archived_at", null)).data?.map((m) => m.id) || []),
    supabase.from("shepherd_activities").select("*").eq("shepherd_id", shepherdId).gte("week_start_date", p.start).lte("week_start_date", p.end),
    supabase.from("weekly_reports").select("id, status").eq("shepherd_id", shepherdId).gte("report_date", p.start).lte("report_date", p.end),
    supabase.from("member_visits").select("id").eq("shepherd_id", shepherdId).gte("visit_date", p.start).lte("visit_date", p.end),
  ]);

  const memberCount = membersRes.count || 0;

  const attendanceRatios: Record<string, number> = {};
  const programs = PROGRAM_DEFINITIONS.map((pr) => pr.id);
  for (const prog of programs) {
    const progAttendance = (attendanceRes.data || []).filter((a) => a.program_type === prog);
    const present = progAttendance.filter((a) => a.is_present).length;
    attendanceRatios[prog] = progAttendance.length > 0 ? Math.round((present / progAttendance.length) * 100) : 0;
  }

  const activities = activitiesRes.data || [];
  const disciplineScores = {
    prayer: activities.length > 0 ? Math.round((activities.filter((a) => a.prayer_q_done || a.daily_prayer_done).length / activities.length) * 100) : 0,
    meditation: activities.length > 0 ? Math.round((activities.filter((a) => a.daily_meditation_done || a.bible_study_q_done).length / activities.length) * 100) : 0,
    evangelism: activities.length > 0 ? Math.round((activities.filter((a) => a.evangelization_done || a.evangelism_q_done).length / activities.length) * 100) : 0,
    fasting: activities.length > 0 ? Math.round((activities.filter((a) => a.fasting_q_done).length / activities.length) * 100) : 0,
  };

  const soulsWon = activities.reduce((sum, a) => sum + (a.pastoral_souls_won || 0), 0);
  const callsCount = activities.reduce((sum, a) => sum + (a.pastoral_followup_calls || a.phone_calls_count || 0), 0);

  const reports = reportsRes.data || [];
  const reportStatus = reports.length > 0 ? reports[reports.length - 1].status : "none";

  const score = computeShepherdScore({
    attendanceRatios,
    disciplineScores,
    soulsWon,
    reportSubmissionRate: shepherdId ? 100 : 0,
    visitsCount: visitsRes.data?.length || 0,
  });

  return {
    memberCount,
    attendanceRatios,
    disciplineScores,
    soulsWon,
    visitsCount: visitsRes.data?.length || 0,
    callsCount,
    reportStatus,
    score,
  };
}

export async function getDepartmentStats(deptId: string, period?: Period): Promise<DepartmentStats> {
  const supabase = await createClient();

  const now = new Date();
  const defaultPeriod: Period = {
    start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: now.toISOString().split("T")[0],
  };
  const p = period || defaultPeriod;

  const [membersRes, newComersRes] = await Promise.all([
    supabase.from("member_departments").select("member:members(first_name, last_name)").eq("department_id", deptId),
    supabase.from("newcomer_registrations").select("id").eq("department_id", deptId).gte("registration_date", p.start).lte("registration_date", p.end),
  ]);

  const memberNames = (membersRes.data || []).map((m: any) => `${m.member?.first_name} ${m.member?.last_name}`);

  return {
    memberCount: memberNames.length,
    memberNames,
    newcomerRegistrations: newComersRes.data?.length || 0,
  };
}

export async function getAttendanceTrend(
  dimension: "group" | "shepherd" | "department",
  entityId: string,
  startDate: string,
  endDate: string,
  granularity: "week" | "month" = "week"
): Promise<AttendanceTrendPoint[]> {
  const supabase = await createClient();

  let memberIds: string[] = [];

  if (dimension === "group") {
    const { data: shepherds } = await supabase
      .from("profiles")
      .select("id")
      .eq("group_id", entityId)
      .eq("role", "shepherd");
    const shepherdIds = (shepherds || []).map((s) => s.id);
    const { data: members } = await supabase
      .from("members")
      .select("id")
      .is("archived_at", null)
      .in("shepherd_id", shepherdIds);
    memberIds = (members || []).map((m) => m.id);
  } else if (dimension === "shepherd") {
    const { data: members } = await supabase
      .from("members")
      .select("id")
      .eq("shepherd_id", entityId)
      .is("archived_at", null);
    memberIds = (members || []).map((m) => m.id);
  } else if (dimension === "department") {
    const { data: deptMembers } = await supabase
      .from("member_departments")
      .select("member_id")
      .eq("department_id", entityId);
    memberIds = (deptMembers || []).map((m) => m.member_id);
  }

  if (memberIds.length === 0) return [];

  const { data: attendance } = await supabase
    .from("attendance")
    .select("member_id, program_type, is_present, date")
    .in("member_id", memberIds)
    .gte("date", startDate)
    .lte("date", endDate);

  // Group by period
  const grouped: Record<string, Record<string, { present: number; total: number }>> = {};

  for (const rec of attendance || []) {
    let periodKey: string;
    if (granularity === "week") {
      const { monday } = getWeekRange(rec.date);
      periodKey = monday;
    } else {
      periodKey = rec.date.substring(0, 7); // YYYY-MM
    }

    if (!grouped[periodKey]) grouped[periodKey] = {};
    if (!grouped[periodKey][rec.program_type]) grouped[periodKey][rec.program_type] = { present: 0, total: 0 };
    grouped[periodKey][rec.program_type].total++;
    if (rec.is_present) grouped[periodKey][rec.program_type].present++;
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, programs]) => ({
      period,
      programs: Object.fromEntries(
        Object.entries(programs).map(([prog, stats]) => [prog, stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0])
      ),
    }));
}

export async function getDisciplineScores(shepherdId: string, period?: Period) {
  const supabase = await createClient();

  const now = new Date();
  const defaultPeriod: Period = {
    start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: now.toISOString().split("T")[0],
  };
  const p = period || defaultPeriod;

  const { data: activities } = await supabase
    .from("shepherd_activities")
    .select("*")
    .eq("shepherd_id", shepherdId)
    .gte("week_start_date", p.start)
    .lte("week_start_date", p.end);

  const acts = activities || [];
  if (acts.length === 0) {
    return { prayer: 0, meditation: 0, evangelism: 0, fasting: 0 };
  }

  return {
    prayer: Math.round((acts.filter((a) => a.prayer_q_done || a.daily_prayer_done).length / acts.length) * 100),
    meditation: Math.round((acts.filter((a) => a.daily_meditation_done || a.bible_study_q_done).length / acts.length) * 100),
    evangelism: Math.round((acts.filter((a) => a.evangelization_done || a.evangelism_q_done).length / acts.length) * 100),
    fasting: Math.round((acts.filter((a) => a.fasting_q_done).length / acts.length) * 100),
  };
}

function computeShepherdScore(data: {
  attendanceRatios: Record<string, number>;
  disciplineScores: { prayer: number; meditation: number; evangelism: number; fasting: number };
  soulsWon: number;
  reportSubmissionRate: number;
  visitsCount: number;
}): number {
  const weights = getDefaultWeights();

  const attendanceScore = normalizeToStars(data.attendanceRatios.sunday_service || 0);
  const disciplineScore = normalizeToStars((data.disciplineScores.prayer + data.disciplineScores.meditation) / 2);
  const evangelismScore = normalizeToStars(Math.min(data.soulsWon * 10, 100));
  const reportScore = normalizeToStars(data.reportSubmissionRate);
  const pastoralScore = normalizeToStars(Math.min(data.visitsCount * 10, 100));

  const weightedScore =
    (attendanceScore * weights.attendance +
      disciplineScore * weights.discipline +
      evangelismScore * weights.evangelism +
      reportScore * weights.reports +
      pastoralScore * weights.pastoral_care) /
    100;

  return Math.round(weightedScore * 10) / 10;
}

export async function compareEntities(
  entities: { type: "group" | "shepherd" | "department"; id: string; name: string }[],
  metrics: string[],
  period?: Period
): Promise<EntityComparison[]> {
  const results: EntityComparison[] = [];

  for (const entity of entities) {
    let metricsData: Record<string, number> = {};

    if (entity.type === "group") {
      const stats = await getGroupStats(entity.id, period);
      metricsData = {
        memberCount: stats.totalMembers,
        attendanceSunday: stats.attendanceByProgram.sunday_service || 0,
        attendanceTuesday: stats.attendanceByProgram.tuesday_class || 0,
        attendanceWednesday: stats.attendanceByProgram.wednesday_class || 0,
        attendanceThursday: stats.attendanceByProgram.thursday_online || 0,
        attendanceFriday: stats.attendanceByProgram.friday_service || 0,
        disciplinePrayer: stats.disciplineScores.prayer,
        disciplineMeditation: stats.disciplineScores.meditation,
        disciplineEvangelism: stats.disciplineScores.evangelism,
        reportSubmissionRate: stats.reportSubmissionRate,
      };
    } else if (entity.type === "shepherd") {
      const stats = await getShepherdStats(entity.id, period);
      metricsData = {
        memberCount: stats.memberCount,
        attendanceSunday: stats.attendanceRatios.sunday_service || 0,
        attendanceTuesday: stats.attendanceRatios.tuesday_class || 0,
        attendanceWednesday: stats.attendanceRatios.wednesday_class || 0,
        attendanceThursday: stats.attendanceRatios.thursday_online || 0,
        attendanceFriday: stats.attendanceRatios.friday_service || 0,
        disciplinePrayer: stats.disciplineScores.prayer,
        disciplineMeditation: stats.disciplineScores.meditation,
        disciplineEvangelism: stats.disciplineScores.evangelism,
        soulsWon: stats.soulsWon,
        reportSubmissionRate: stats.reportStatus === "submitted" ? 100 : 0,
        shepherdScore: stats.score,
      };
    } else if (entity.type === "department") {
      const stats = await getDepartmentStats(entity.id, period);
      metricsData = {
        memberCount: stats.memberCount,
        newcomerRegistrations: stats.newcomerRegistrations,
      };
    }

    results.push({
      entityId: entity.id,
      entityName: entity.name,
      entityType: entity.type,
      metrics: metricsData,
    });
  }

  return results;
}
