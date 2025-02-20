import type { Message } from "ai"
import { questions, FIRST_QUESTION } from "@/lib/questions"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

interface AnswerHistory {
    [questionId: string]: string | string[]
}

export async function POST(req: Request) {
    const { messages, lastQuestionId } = await req.json()

    console.log("messages are ", messages)
    console.log("lastQuestionId is ", lastQuestionId)

    const systemMessage = {
        role: "system",
        content:
            "You are a friendly bot that asks users questions from a predefined question bank. Ask one question at a time and wait for the user's response before moving to the next question. If the question has predefined options, present them to the user.",
    }

    const chatHistory = messages.map((m: Message) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
    }))

    // Build answer history from chat history
    const answerHistory: AnswerHistory = {}
    let currentQuestionId = lastQuestionId || FIRST_QUESTION

    // Process chat history to build answer history
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i]
        if (message.role === "assistant") {
            // Find the question that was asked
            const [questionText] = message.content.split(":")
            const questionEntry = Object.entries(questions).find(([_, q]) => q.question === questionText)

            if (questionEntry) {
                const [qId, question] = questionEntry
                // Get the user's answer if available
                if (i + 1 < messages.length && messages[i + 1].role === "user") {
                    const answer = messages[i + 1].content
                    answerHistory[qId] = question.type === "multi-select" ? answer.split(", ") : answer
                }
                currentQuestionId = qId
            }
        }
    }

    console.log("Answer history:", answerHistory)

    // Determine the next question
    if (messages.length === 0) {
        currentQuestionId = lastQuestionId || FIRST_QUESTION
    } else {
        // Find the last question asked
        const lastQuestion = messages
            .filter((m) => m.role === "assistant")
            .map((m) => {
                const [question] = m.content.split(":")
                return Object.entries(questions).find(([_, q]) => q.question === question)
            })
            .filter(Boolean)
            .pop()

        if (!lastQuestion) {
            currentQuestionId = lastQuestionId || FIRST_QUESTION
        } else {
            const [lastQuestionId, lastQuestionData] = lastQuestion
            // Get the user's answer to the last question
            const lastAnswer = messages[messages.length - 1].content.trim()

            console.log("Last question ID:", lastQuestionId)
            console.log("Last answer:", lastAnswer)

            // Store answer in history
            if (lastQuestionData.type === "multi-select") {
                answerHistory[lastQuestionId] = lastAnswer.split(", ")
            } else {
                answerHistory[lastQuestionId] = lastAnswer
            }

            // Determine the next question based on the answer and answer history
            if (typeof lastQuestionData.nextQuestion === "function") {
                if (lastQuestionId === "employment_status") {
                    currentQuestionId = lastAnswer.trim() === "Yes" ? "income_sources" : "annual_income"
                } else if (lastQuestionId === "home_equity") {
                    const assetsAnswer = answerHistory["assets"] as string[]
                    currentQuestionId = assetsAnswer?.includes("I have savings") ? "savings_amount" : "situation_description"
                } else {
                    currentQuestionId = lastQuestionData.nextQuestion(
                        Array.isArray(answerHistory[lastQuestionId])
                            ? (answerHistory[lastQuestionId] as string[])
                            : [answerHistory[lastQuestionId] as string],
                    )
                }
            } else {
                currentQuestionId = lastQuestionData.nextQuestion || FIRST_QUESTION
            }

            console.log("Next question ID:", currentQuestionId)
        }
    }

    // If we've reached the end of the questions, start over
    if (!currentQuestionId || !questions[currentQuestionId]) {
        currentQuestionId = FIRST_QUESTION
    }

    const currentQuestion = questions[currentQuestionId]
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

    return new Response(
        JSON.stringify({
            message: userMessage1,
            nextQuestionId: currentQuestionId,
        }),
        { status: 200 },
    )
}

