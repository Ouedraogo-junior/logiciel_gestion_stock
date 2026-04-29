// app/api/settings/shop/route.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await admin
    .from('shop_settings')
    .select('name, phone, email, address, logo_url, description')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const body = await request.json()

  const { data: shop } = await admin.from('shop_settings').select('id').single()
  if (!shop?.id) return NextResponse.json({ error: 'Settings introuvables' }, { status: 404 })

  const { error } = await admin
    .from('shop_settings')
    .update({ ...body, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq('id', shop.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('logo') as File
  if (!file) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const path = `logo/shop-logo.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from('shop-assets')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = admin.storage
    .from('shop-assets')
    .getPublicUrl(path)

  const { data: shop } = await admin.from('shop_settings').select('id').single()
  if (!shop?.id) return NextResponse.json({ error: 'Settings introuvables' }, { status: 404 })

  await admin.from('shop_settings').update({
    logo_url: publicUrl,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }).eq('id', shop.id)

  return NextResponse.json({ logo_url: publicUrl })
}