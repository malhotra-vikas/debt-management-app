import { type Message } from "ai";
import { questions } from "@/lib/questions";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Ensure API Key is set in .env

const questionBank = questions;

export async function POST(req: Request) {
    const { messages } = await req.json();

    console.log("messages are ", messages)

    const systemMessage = {
        role: "system",
        content:
            "You are a friendly bot that asks users questions from a predefined question bank. Ask one question at a time and wait for the user's response before moving to the next question. If the question has predefined options, present them to the user.",
    };

    const chatHistory = messages.map((m: Message) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
    }));

    let currentQuestionIndex = chatHistory.filter((m) => m.role === "assistant").length;
    console.log("currentQuestionIndex is ", currentQuestionIndex)

    if (currentQuestionIndex >= questionBank.length) {
        currentQuestionIndex = 0;
    }

    const currentQuestion = questionBank[currentQuestionIndex];
    console.log("currentQuestion is ", currentQuestion)

    const userMessage =
        currentQuestion.type === "options"
            ? `Ask the user: "${currentQuestion.question}" and present the following options: ${currentQuestion.options?.join(", ")}. Include "OPTIONS:" followed by the options in your response.`
            : `Ask the user: "${currentQuestion.question}"`;

    console.log("userMessage sent to AI Payload is ", userMessage)

    const openaiPayload = {
        model: "gpt-4o-mini", // Ensure you have access to GPT-4 or use "gpt-3.5-turbo"
        messages: [systemMessage, ...chatHistory, { role: "user", content: userMessage }],
        stream: false, // Disable streaming for now to avoid `streamText` issues
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(openaiPayload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API Error:", errorData);
        return new Response(JSON.stringify({ error: "Failed to fetch OpenAI response" }), { status: 500 });
    }

    const responseData = await response.json();

    const aiMessage = responseData.choices[0].message.content;
    console.log("AI aiMessage is ", aiMessage)

    return new Response(JSON.stringify({ message: aiMessage }), { status: 200 });
}
