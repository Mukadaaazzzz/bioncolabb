import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  
  const { id } = params

  try {
    // First verify the user owns this challenge
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if challenge exists and belongs to user
    const { data: challenge, error: fetchError } = await supabase
      .from('challenges')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (fetchError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.creator_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the challenge
    const { error: deleteError } = await supabase
      .from('challenges')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting challenge:', error)
    return NextResponse.json(
      { error: 'Failed to delete challenge' },
      { status: 500 }
    )
  }
}