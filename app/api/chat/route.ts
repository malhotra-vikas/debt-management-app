import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
    const { messages } = await req.json()

    // Configure the AI to collect specific information
    const systemPrompt = `You are Merlin a warm, friendly debt analyst. You understand and empathize with challenging life situations that people may be going through. 
  
  You are an expert on how these life situations can put pressure on people's finacial situations. 
  
  You are an expert analyst who asks users questions to understand their personal, financial, income and debt situation. 
  
  Your goal is to collect the following information from users:
- Name
- Email
- Personal Situations around what is leading them to high debt

Please collect this information one step at a time and validate responses.`

    const result = streamText({
        model: openai("gpt-4o"),
        messages,
        system: systemPrompt,
    })

    return result.toDataStreamResponse()
}