import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { current_password, new_password } = await request.json()

  if (!current_password || !new_password)
    return NextResponse.json({ error: 'Champs requis' }, { status: 400 })

  if (new_password.length < 8)
    return NextResponse.json({ error: 'Mot de passe trop court (8 caractères min)' }, { status: 400 })

  // Vérifier l'ancien mot de passe en tentant une connexion
  const { data: profile } = await admin
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const fakeEmail = `${profile?.username}@boutique.local`

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: fakeEmail,
    password: current_password,
  })

  if (signInError)
    return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 })

  // Mettre à jour le mot de passe
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: new_password,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Désactiver le flag must_change_password si actif
  await admin
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}