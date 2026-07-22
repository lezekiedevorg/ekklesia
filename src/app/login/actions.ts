'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const isSignUp = formData.get('isSignUp') === 'true'

  console.log(`[loginAction] Début de tentative pour email=${email}, isSignUp=${isSignUp}`);

  if (!email || !password) {
    console.log(`[loginAction] Email ou mot de passe manquant.`);
    return { error: "Veuillez fournir une adresse email et un mot de passe." }
  }

  const supabase = await createClient()

  if (isSignUp) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })
    if (error) {
      console.error(`[loginAction] Erreur signUp:`, error.message);
      return { error: error.message }
    }
    return { message: "Veuillez vérifier votre boîte email pour confirmer votre compte." }
  } else {
    console.log(`[loginAction] Appel de signInWithPassword...`);
    const start = Date.now();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    console.log(`[loginAction] signInWithPassword terminé en ${Date.now() - start}ms. Erreur:`, error?.message || 'Aucune');
    if (error) {
      return { error: error.message }
    }
  }

  console.log(`[loginAction] Connexion réussie, retour { success: true }...`);
  return { success: true }
}
