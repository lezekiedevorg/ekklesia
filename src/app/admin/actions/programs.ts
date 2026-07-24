'use server'

import { createClient } from '@/lib/supabase/server';
import { assertPermission } from '@/lib/auth/permissions';
import { logAuditAction } from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

export interface ProgramInput {
  key: string;
  label: string;
  icon?: string;
  day_of_week?: number | null;
  eligibility_class?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export async function getProgramsAction() {
  try {
    await assertPermission('programs:view');
    const supabase = await createClient();
    const { data, error } = await supabase.from('programs').select('*').order('sort_order');
    if (error) return { error: error.message };
    return { success: true, programs: data || [] };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la récupération des programmes.' };
  }
}

export async function createProgramAction(data: ProgramInput) {
  try {
    await assertPermission('programs:edit');
    const supabase = await createClient();

    const key = data.key?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const label = data.label?.trim();
    if (!key || !label) return { error: 'La clé et le libellé sont obligatoires.' };

    const { error } = await supabase.from('programs').insert({
      key,
      label,
      icon: data.icon?.trim() || '📅',
      day_of_week: data.day_of_week ?? null,
      eligibility_class: data.eligibility_class?.trim() || null,
      is_active: data.is_active ?? true,
      sort_order: data.sort_order ?? 100,
    });
    if (error) {
      if (error.code === '23505') return { error: `La clé "${key}" existe déjà.` };
      return { error: error.message };
    }

    await logAuditAction({ action: 'PROGRAM_CREATED', resourceType: 'program', resourceId: key, newValues: { key, label } });
    revalidatePath('/admin/programs');
    return { success: true, message: `Programme "${label}" créé.` };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la création du programme.' };
  }
}

export async function updateProgramAction(id: string, data: Partial<ProgramInput>) {
  try {
    await assertPermission('programs:edit');
    const supabase = await createClient();

    // key is immutable (attendance rows reference it) — never update it here
    const payload: any = {};
    if (data.label !== undefined) payload.label = data.label.trim();
    if (data.icon !== undefined) payload.icon = data.icon.trim() || '📅';
    if (data.day_of_week !== undefined) payload.day_of_week = data.day_of_week;
    if (data.eligibility_class !== undefined) payload.eligibility_class = data.eligibility_class || null;
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    if (data.sort_order !== undefined) payload.sort_order = data.sort_order;

    const { error } = await supabase.from('programs').update(payload).eq('id', id);
    if (error) return { error: error.message };

    await logAuditAction({ action: 'PROGRAM_UPDATED', resourceType: 'program', resourceId: id, newValues: payload });
    revalidatePath('/admin/programs');
    return { success: true, message: 'Programme mis à jour.' };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la mise à jour du programme.' };
  }
}

export async function deleteProgramAction(id: string) {
  try {
    await assertPermission('programs:edit');
    const supabase = await createClient();

    const { data: prog } = await supabase.from('programs').select('key, label').eq('id', id).single();
    if (!prog) return { error: 'Programme introuvable.' };

    // Refuse deletion if attendance rows reference this program key (keep history intact)
    const { count } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('program_type', prog.key);

    if ((count || 0) > 0) {
      return { error: `Ce programme a ${count} pointage(s) enregistré(s). Désactivez-le plutôt que de le supprimer.` };
    }

    const { error } = await supabase.from('programs').delete().eq('id', id);
    if (error) return { error: error.message };

    await logAuditAction({ action: 'PROGRAM_DELETED', resourceType: 'program', resourceId: prog.key, oldValues: prog });
    revalidatePath('/admin/programs');
    return { success: true, message: `Programme "${prog.label}" supprimé.` };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la suppression du programme.' };
  }
}
