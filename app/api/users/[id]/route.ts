import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const body = await request.json()

  const profileUpdate: Record<string, unknown> = {}
  if (body.role !== undefined) profileUpdate.role = body.role
  if (body.is_active !== undefined) profileUpdate.is_active = body.is_active

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await supabase
      .from('profiles').update(profileUpdate as any).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.password) {
    const { error } = await admin.auth.admin.updateUserById(id, {
      password: body.password,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('profiles')
      .update({ must_change_password: true }).eq('id', id)
  }

  return NextResponse.json({ success: true })
}