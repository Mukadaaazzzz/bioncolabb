// app/api/literature-review/route.ts
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {
  const { query, colabContext } = await request.json()
  
  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompt = `Generate a concise literature review about "${query}" in the context of ${colabContext || 'scientific research'}. 
    Focus on recent and relevant studies, summarize key findings, and highlight gaps in the research. 
    Format the response in clear paragraphs with proper academic tone.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ review: text })
  } catch (error) {
    console.error('Error generating literature review:', error)
    return NextResponse.json(
      { error: 'Failed to generate literature review' },
      { status: 500 }
    )
  }
}