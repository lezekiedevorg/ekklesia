"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function registerNewcomer(data: {
  first_name: string;
  last_name: string;
  phone?: string;
  residence_location?: string;
  invited_by_member_id?: string;
  notes?: string;
  assigned_shepherd_id?: string;
  is_self_initiated?: boolean;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  let shepherdId = data.assigned_shepherd_id || null;

  // Auto-assign shepherd based on inviter logic
  if (data.invited_by_member_id && !shepherdId) {
    // Get the inviter's shepherd
    const { data: inviter } = await supabase
      .from("members")
      .select("shepherd_id")
      .eq("id", data.invited_by_member_id)
      .single();

    if (inviter?.shepherd_id) {
      shepherdId = inviter.shepherd_id;
    } else {
      // Inviter has no shepherd, try to find a shepherd in their group
      const { data: inviterProfile } = await supabase
        .from("members")
        .select("shepherd_id, profiles!members_shepherd_id_fkey(group_id)")
        .eq("id", data.invited_by_member_id)
        .single();

      const profileData = inviterProfile?.profiles as any;
      if (profileData?.group_id) {
        const { data: groupShepherds } = await supabase
          .from("profiles")
          .select("id")
          .eq("group_id", profileData.group_id)
          .eq("role", "shepherd")
          .limit(1);

        if (groupShepherds && groupShepherds.length > 0) {
          shepherdId = groupShepherds[0].id;
        }
      }
    }
  }

  // Create the member
  const { data: member, error: memberError } = await supabase
    .from("members")
    .insert([
      {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || null,
        residence_location: data.residence_location || null,
        shepherd_id: shepherdId,
        invited_by_member_id: data.invited_by_member_id || null,
        status: "new",
        current_class: "none",
        consecutive_sundays_present: 1,
        consecutive_absences: 0,
      },
    ])
    .select()
    .single();

  if (memberError) throw memberError;

  // Log the newcomer registration
  const { error: regError } = await supabase.from("newcomer_registrations").insert([
    {
      member_id: member.id,
      registered_by: user.id,
      registration_date: new Date().toISOString().split("T")[0],
      invited_by_member_id: data.invited_by_member_id || null,
      residence_location: data.residence_location || null,
      is_self_initiated: data.is_self_initiated || false,
      assigned_shepherd_id: shepherdId,
      notes: data.notes || null,
    },
  ]);

  if (regError) throw regError;

  // Auto-assign to "Amis des Nouveaux" department
  const { data: dept } = await supabase
    .from("departments")
    .select("id")
    .eq("name", "Amis des Nouveaux")
    .single();

  if (dept) {
    await supabase.from("member_departments").insert([
      {
        member_id: member.id,
        department_id: dept.id,
        role: "member",
      },
    ]);
  }

  revalidatePath("/admin/newcomers");
  return member;
}

export async function getNewcomerRegistrations(period?: {
  start: string;
  end: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("newcomer_registrations")
    .select(`
      *,
      member:members(first_name, last_name, phone, status, consecutive_sundays_present),
      registered_by_profile:profiles!newcomer_registrations_registered_by_fkey(first_name, last_name),
      invited_by:members!newcomer_registrations_invited_by_member_id_fkey(first_name, last_name),
      assigned_shepherd:profiles!newcomer_registrations_assigned_shepherd_id_fkey(first_name, last_name)
    `)
    .order("registration_date", { ascending: false });

  if (period) {
    query = query
      .gte("registration_date", period.start)
      .lte("registration_date", period.end);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getNewcomerStats(period?: {
  start: string;
  end: string;
}) {
  const supabase = await createClient();

  let query = supabase.from("newcomer_registrations").select("*");

  if (period) {
    query = query
      .gte("registration_date", period.start)
      .lte("registration_date", period.end);
  }

  const { data, error } = await query;

  if (error) throw error;

  const registrations = data || [];
  const total = registrations.length;
  const selfInitiated = registrations.filter((r) => r.is_self_initiated).length;
  const invited = total - selfInitiated;

  return {
    total,
    selfInitiated,
    invited,
  };
}
