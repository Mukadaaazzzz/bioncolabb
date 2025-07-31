// app/api/colab/[slug]/fork/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch original colab
    const { data: originalColab, error: fetchError } = await supabase
      .from('colabs')
      .select('*')
      .eq('slug', slug)
      .single()

    if (fetchError || !originalColab) {
      return NextResponse.json(
        { error: 'Colab not found' },
        { status: 404 }
      )
    }

    // Create unique slug for forked colab
    const forkedSlug = `${originalColab.slug}-fork-${Date.now()}`

    // Create forked colab
    const { data: forkedColab, error: forkError } = await supabase
      .from('colabs')
      .insert({
        name: `${originalColab.name} (Fork)`,
        description: originalColab.description,
        readme: originalColab.readme,
        slug: forkedSlug,
        creator_id: user.id,
        forked_from: originalColab.id,
        tags: originalColab.tags,
        visibility: 'public',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (forkError) {
      console.error('Error creating fork:', forkError)
      return NextResponse.json(
        { error: 'Failed to fork colab' },
        { status: 500 }
      )
    }

    // Increment fork count on original colab
    const { error: updateError } = await supabase
      .from('colabs')
      .update({ 
        forks: (originalColab.forks || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', originalColab.id)

    if (updateError) {
      console.error('Error updating fork count:', updateError)
    }

    return NextResponse.json({
      id: forkedColab.id,
      slug: forkedColab.slug,
      name: forkedColab.name
    })

  } catch (error) {
    console.error('Fork API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}