import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  console.log('user:', user?.id)
  console.log('authError:', authError)

  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile, error: profileError } = await admin
    .from('profiles').select('role').eq('id', user.id).single()

  console.log('profile:', profile)
  console.log('profileError:', profileError)
  
  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, username, role, is_active, must_change_password, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // ← admin client pour bypasser la RLS
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { username, password, full_name, role } = await request.json()

  if (!username || !password || !full_name || !role)
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  const fakeEmail = `${username.trim().toLowerCase()}@boutique.local`

  const { data: created, error } = await admin.auth.admin.createUser({
    email: fakeEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name, role, username, created_by: user.id },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(created.user, { status: 201 })
}