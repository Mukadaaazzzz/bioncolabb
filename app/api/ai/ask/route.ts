import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })
    
    const result = await model.generateContent(`
      You are Shawn, an AI research assistant for scientists. 
      Your task is to help with literature review, experimental design, and data analysis.
      Be concise but thorough in your responses.
      
      User question: ${prompt}
    `)
    
    const response = await result.response
    const text = response.text()
    
    return NextResponse.json({ response: text })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    )
  }
}