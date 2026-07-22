export type UserRole = "shepherd" | "leader" | "pastor";

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  group_id?: string | null;
  groups?: {
    name: string;
  };
}

export interface Group {
  id: string;
  name: string;
  description?: string;
}

export type MemberStatus = "new_convert" | "in_integration" | "active" | "member" | "archived";
export type MemberClass = "none" | "tuesday_class" | "wednesday_class" | "completed";

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: MemberStatus;
  current_class: MemberClass;
  consecutive_sundays_present: number;
  consecutive_absences: number;
  last_seen_date?: string | null;
  shepherd_id: string;
  invited_by_member_id?: string | null;
  created_at: string;
  archived_at?: string | null;
}

export interface Attendance {
  member_id: string;
  program_type: string;
  is_present: boolean;
  date: string;
}

export interface SundayAbsence {
  member_id: string;
  date: string;
  reason: string;
}

export interface ShepherdActivity {
  id?: string;
  shepherd_id: string;
  week_start_date: string;
  // Daily Disciplines
  daily_prayer_q_done: boolean;
  daily_prayer_i_done: boolean;
  bible_reading_q_done: boolean;
  bible_reading_i_done: boolean;
  meditation_q_done: boolean;
  meditation_i_done: boolean;
  meditation_book?: string | null;
  meditation_chapter_start?: number | null;
  meditation_chapter_end?: number | null;
  evangelism_q_done: boolean;
  evangelism_i_done: boolean;
  // Pastoral Actions
  pastoral_souls_won: number;
  pastoral_new_contacts: number;
  pastoral_first_timers: number;
  pastoral_home_visits: number;
  pastoral_sick_visits: number;
  pastoral_consolation_visits: number;
  pastoral_followup_calls: number;
  // Church programs presence (manual overrides or synced)
  church_sunday_presence?: boolean;
  church_sunday_reason?: string | null;
  church_tuesday_presence?: boolean;
  church_tuesday_reason?: string | null;
  church_wednesday_presence?: boolean;
  church_wednesday_reason?: string | null;
  church_thursday_presence?: boolean;
  church_thursday_reason?: string | null;
  church_friday_presence?: boolean;
  church_friday_reason?: string | null;
  // Monthly activities
  monthly_pre_service_intercession: boolean;
  monthly_in_person_prayer_done?: boolean;
  monthly_anagkazo: boolean;
  monthly_group_evangelization: boolean;
  monthly_prayer_vigil_done?: boolean;
  prayer_chain_done: boolean;
  // Legacy aliases and computed fields
  monthly_vigil_done?: boolean;
  monthly_in_person_done?: boolean;
  monthly_department_done?: boolean;
  monthly_offering_done?: boolean;
  mentoring_done?: boolean;
  visits_done?: boolean;
  phone_calls_count?: number;
  phone_calls_done?: boolean;
  personal_invites_count?: number;
  daily_prayer_done?: boolean;
  daily_meditation_done?: boolean;
  meditated_book?: string | null;
  evangelization_done?: boolean;
  prayer_q_done?: boolean;
  prayer_i_done?: boolean;
  fasting_q_done?: boolean;
  fasting_i_done?: boolean;
  word_listening_q_done?: boolean;
  word_listening_i_done?: boolean;
  bible_study_q_done?: boolean;
  bible_study_i_done?: boolean;
  meditation_book_name?: string | null;
  // Theme & observations
  mentoring_theme?: string | null;
  other_observations?: string | null;
  [key: string]: any;
}

export interface ProgramSummaryItem {
  program_type: string;
  label: string;
  icon: string;
  present_count: number;
  eligible_count: number;
  ratio_pct: number;
}

export interface WeeklyReportContent {
  total_members: number;
  sunday_present_count: number;
  attendance_ratio_pct: number;
  absentees_with_reasons: { name: string; reason: string }[];
  new_members_progression?: {
    name: string;
    status: string;
    class_name: string;
    consecutive_present: number;
  }[];
  programs_summary?: ProgramSummaryItem[];
  summary_data?: ProgramSummaryItem[];
  [key: string]: any;
}

export interface WeeklyReport {
  id: string;
  shepherd_id: string;
  group_id: string;
  report_date: string;
  week_end_date: string;
  status: "submitted" | "approved" | "rejected";
  content: WeeklyReportContent;
  report_data?: WeeklyReportContent;
  profiles?: {
    first_name: string;
    last_name: string;
  };
  groups?: {
    name: string;
  };
  summary_data?: ProgramSummaryItem[];
  [key: string]: any;
}
