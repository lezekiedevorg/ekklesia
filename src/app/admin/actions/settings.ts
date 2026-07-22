'use server'

import { createClient } from '@/lib/supabase/server';
import { assertPermission } from '@/lib/auth/permissions';
import { logAuditAction } from '@/lib/audit/logger';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function getSettingsAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('category, key');

    if (error) return { error: error.message };
    return { success: true, settings: data || [] };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la récupération des paramètres.' };
  }
}

export async function updateSettingAction(key: string, value: any, category?: string, description?: string) {
  try {
    const context = await assertPermission('settings:edit');
    const supabase = await createClient();

    const { data: oldSetting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single();

    const payload: any = {
      key,
      value: JSON.parse(JSON.stringify(value)),
      updated_at: new Date().toISOString(),
      updated_by: context.user.id,
    };
    if (category) payload.category = category;
    if (description) payload.description = description;

    const { error } = await supabase
      .from('app_settings')
      .upsert(payload);

    if (error) return { error: error.message };

    await logAuditAction({
      action: 'SETTING_UPDATED',
      resourceType: 'setting',
      resourceId: key,
      oldValues: oldSetting ? oldSetting.value : null,
      newValues: value,
    });

    revalidatePath('/admin/settings');
    revalidatePath('/admin');
    return { success: true, message: `Paramètre (${key}) mis à jour.` };
  } catch (err: any) {
    return { error: err.message || 'Erreur lors de la modification du paramètre.' };
  }
}
