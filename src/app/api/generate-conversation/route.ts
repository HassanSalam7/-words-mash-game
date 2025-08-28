import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, wordCount, characters } = body

    if (!topic || !characters || characters.length < 2) {
      return NextResponse.json(
        { error: 'Topic and at least 2 characters are required' },
        { status: 400 }
      )
    }

    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      )
    }

    // Make API call to Groq
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a creative dialogue writer. Generate engaging conversations between characters on given topics. Always respond with valid JSON."
          },
          {
            role: "user",
            content: `Generate a conversation between ${characters.join(' and ')} about ${topic}. The conversation should be approximately ${wordCount} words and feel natural and engaging. Format your response as a JSON object with this exact structure:
            {
              "turns": [
                {"character": "character_name", "dialogue": "what they say"},
                {"character": "character_name", "dialogue": "what they say"}
              ]
            }`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    // Parse the AI response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(content)
    } catch (parseError) {
      console.error('Failed to parse AI response:', content)
      throw new Error('Invalid response format from AI')
    }

    // Validate the response structure
    if (!parsedResponse.turns || !Array.isArray(parsedResponse.turns)) {
      throw new Error('Invalid conversation structure from AI')
    }

    // Return the formatted conversation
    return NextResponse.json({
      id: `conv_${Date.now()}`,
      topic,
      wordCount,
      characters,
      turns: parsedResponse.turns,
      createdAt: new Date()
    })

  } catch (error) {
    console.error('Conversation generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate conversation. Please try again.' },
      { status: 500 }
    )
  }
}