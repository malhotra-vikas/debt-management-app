import type { Message } from "ai"
import { questions } from "@/lib/questions"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const questionBank = questions

export async function POST(req: Request) {
    const { messages } = await req.json()

    console.log("messages are ", messages)

    const systemMessage = {
        role: "system",
        content:
            "You are a friendly bot that asks users questions from a predefined question bank. Ask one question at a time and wait for the user's response before moving to the next question. If the question has predefined options, present them to the user.",
    }

    const chatHistory = messages.map((m: Message) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
    }))

    let currentQuestionIndex = chatHistory.filter((m) => m.role === "assistant").length
    console.log("currentQuestionIndex is ", currentQuestionIndex)

    if (currentQuestionIndex >= questionBank.length) {
        currentQuestionIndex = 0
    }

    const currentQuestion = questionBank[currentQuestionIndex]
    console.log("currentQuestion is ", currentQuestion)

    let userMessage = `Ask the user: "${currentQuestion.question}"`
    let userMessage1 = `${currentQuestion.question}`

    if (currentQuestion.type === "options" || currentQuestion.type === "multi-select") {
        const optionsString = currentQuestion.options?.join(", ")
        const selectType = currentQuestion.type === "multi-select" ? "Select all that apply" : "Please choose one"
        userMessage += ` ${selectType}. OPTIONS: ${optionsString}`
        userMessage1 += `:${currentQuestion.type}:${currentQuestion.options}`
    } else if (currentQuestion.type === "text") {
        userMessage1 += `:${currentQuestion.type}:`
    }

    console.log("userMessage sent to AI Payload is ", userMessage)
    console.log("userMessage sent to to UI is  ", userMessage1)

    const openaiPayload = {
        model: "gpt-4o-mini",
        messages: [systemMessage, ...chatHistory, { role: "user", content: userMessage }],
        stream: false,
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(openaiPayload),
    })

    if (!response.ok) {
        const errorData = await response.json()
        console.error("OpenAI API Error:", errorData)
        return new Response(JSON.stringify({ error: "Failed to fetch OpenAI response" }), { status: 500 })
    }

    const responseData = await response.json()

    const aiMessage = responseData.choices[0].message.content
    console.log("AI aiMessage is ", aiMessage)

    return new Response(JSON.stringify({ message: userMessage1 }), { status: 200 })
}

