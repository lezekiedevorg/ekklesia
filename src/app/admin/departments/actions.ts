"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createDepartment(data: {
  name: string;
  description?: string;
  icon?: string;
  leader_id?: string;
}) {
  const supabase = await createClient();

  const { data: dept, error } = await supabase
    .from("departments")
    .insert([data])
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/admin/departments");
  return dept;
}

export async function updateDepartment(
  id: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    leader_id?: string;
    is_active?: boolean;
  }
) {
  const supabase = await createClient();

  const { data: dept, error } = await supabase
    .from("departments")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/admin/departments");
  revalidatePath(`/admin/departments/${id}`);
  return dept;
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("departments").delete().eq("id", id);

  if (error) throw error;

  revalidatePath("/admin/departments");
}

export async function assignMemberToDepartment(
  memberId: string,
  departmentId: string,
  role: string = "member"
) {
  const supabase = await createClient();

  const { error } = await supabase.from("member_departments").upsert(
    [
      {
        member_id: memberId,
        department_id: departmentId,
        role,
      },
    ],
    { onConflict: "member_id,department_id" }
  );

  if (error) throw error;

  revalidatePath(`/admin/departments/${departmentId}`);
}

export async function removeMemberFromDepartment(
  memberId: string,
  departmentId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("member_departments")
    .delete()
    .eq("member_id", memberId)
    .eq("department_id", departmentId);

  if (error) throw error;

  revalidatePath(`/admin/departments/${departmentId}`);
}

export async function getDepartments() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .select(`
      *,
      leader:profiles!departments_leader_id_fkey(first_name, last_name),
      member_departments(count)
    `)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  return data.map((dept) => ({
    ...dept,
    member_count: dept.member_departments?.[0]?.count || 0,
  }));
}

export async function getDepartmentById(id: string) {
  const supabase = await createClient();

  const { data: dept, error } = await supabase
    .from("departments")
    .select(`
      *,
      leader:profiles!departments_leader_id_fkey(first_name, last_name)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  const { data: members } = await supabase
    .from("member_departments")
    .select(`
      *,
      member:members(first_name, last_name, phone, status)
    `)
    .eq("department_id", id);

  return {
    ...dept,
    members: members || [],
  };
}
