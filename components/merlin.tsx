"use client"

import type React from "react"
import { useChat } from "@ai-sdk/react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Bot, Shield, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface CollectedData {
    name?: string
    email?: string
    situation?: string
}

const initialMessage = {
    id: "initial-message",
    content: `Hello! I'm Merlin, your personal financial wizard. I work with DealingWithDebt and i am here to help you get debt-free. 
        Please feel free to share as much information as you can with me so that i can come up with a personalized plan for you. 
        Lets start by getting to know each other. What is your first name? `,
    role: "assistant",
}

export default function Chat() {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        initialMessages: [initialMessage],
    })
    const [collectedData, setCollectedData] = useState<CollectedData>({})
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [scrollToBottom])

    // Update collected data based on AI responses
    const updateCollectedData = (message: string) => {
        if (message.toLowerCase().includes("name is")) {
            const name = message.split("name is ")[1].split(" ")[0].trim()
            setCollectedData((prev) => ({ ...prev, name }))
        }
        if (message.includes("@")) {
            const email = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0]
            if (email) setCollectedData((prev) => ({ ...prev, email }))
        }
        if (message.length > 50) {
            setCollectedData((prev) => ({ ...prev, situation: message }))
        }
    }

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const currentInput = input
        handleSubmit(e)
        updateCollectedData(currentInput)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#f9fafb] p-4">
            {/* Trust Indicators */}
            <div className="w-full max-w-2xl mb-4 flex justify-center gap-6 text-sm text-[var(--color-text-secondary)]">
                <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Secure & Confidential</span>
                </div>
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Expert Financial Analysis</span>
                </div>
            </div>

            <Card className="w-full max-w-2xl shadow-lg border-0">
                <CardHeader className="border-b bg-white py-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-[var(--color-bg-bot)]">
                            <Bot className="h-8 w-8 text-[var(--color-primary)]" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-[var(--color-primary)]">Merlin</CardTitle>
                            <CardDescription className="text-[var(--color-text-secondary)] text-base">
                                Your Trusted Financial and Debt Analysis Assistant
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="h-[60vh] overflow-y-auto p-6" id="chat-container">
                    <div className="space-y-6">
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} message-container`}
                            >
                                <div className={`message-bubble ${m.role === "user" ? "message-bubble-user" : "message-bubble-bot"}`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start message-container">
                                <div className="message-bubble message-bubble-bot">
                                    <div className="loader" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div ref={messagesEndRef} />
                </CardContent>

                <CardFooter className="border-t bg-white p-6">
                    <form onSubmit={onSubmit} className="input-form w-full">
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Type your message here..."
                            className="input-field"
                        />
                        <Button type="submit" disabled={isLoading} className="submit-button px-6">
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send message</span>
                        </Button>
                    </form>
                </CardFooter>
            </Card>

            {/* Data Preview */}
            {Object.keys(collectedData).length > 0 && (
                <Card className="w-full max-w-2xl mt-6 shadow-md border-0">
                    <CardHeader className="border-b py-4">
                        <CardTitle className="text-[var(--color-primary)] text-lg font-medium">Information Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {Object.entries(collectedData).map(([key, value]) => (
                                <div key={key} className="flex gap-4 items-start">
                                    <span className="font-medium capitalize text-[var(--color-text-secondary)] w-24">{key}:</span>
                                    <span className="text-[var(--color-text-primary)] flex-1">{value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Footer Trust Message */}
            <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)] max-w-md">
                Your information is protected and will only be used to provide you with the best possible financial guidance.
            </div>
        </div>
    )
}

