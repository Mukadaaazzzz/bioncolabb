// app/api/colab/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Fetch colab with creator profile
    const { data: colab, error } = await supabase
      .from('colabs')
      .select(`
        *,
        creator:profiles!colabs_creator_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching colab:', error)
      return NextResponse.json(
        { error: 'Colab not found' },
        { status: 404 }
      )
    }

    // Increment view count
    const { error: updateError } = await supabase
      .from('colabs')
      .update({ 
        views: (colab.views || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', colab.id)

    if (updateError) {
      console.error('Error updating view count:', updateError)
    }

    // Format the response to match the expected structure
    const formattedColab = {
      id: colab.id,
      name: colab.name,
      description: colab.description || '',
      readme: colab.readme || '',
      slug: colab.slug,
      createdAt: colab.created_at,
      updatedAt: colab.updated_at,
      creator: {
        name: colab.creator?.full_name || 'Anonymous',
        avatar: colab.creator?.avatar_url || '',
        username: colab.creator?.username || 'anonymous'
      },
      stats: {
        forks: colab.forks || 0,
        contributors: colab.contributors || 1,
        stars: colab.stars || 0,
        views: (colab.views || 0) + 1
      },
      tags: colab.tags || []
    }

    return NextResponse.json(formattedColab)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}