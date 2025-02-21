"use client"

import type React from "react"
import { useChat } from "@ai-sdk/react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Bot } from "lucide-react"
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
    content: "Hello! I'm Merlin, a warm and friendly debt analyst here to help you. How can I assist you today?",
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
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader className="border-b bg-white">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-[var(--color-bg-bot)]">
                            <Bot className="h-6 w-6 text-[var(--color-primary)]" />
                        </div>
                        <div>
                            <CardTitle className="text-[var(--color-primary)]">Merlin</CardTitle>
                            <CardDescription>Your Friendly Debt Analysis Assistant</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="h-[60vh] overflow-y-auto p-4 space-y-4" id="chat-container">
                    {messages.map((m) => (
                        <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} message-container`}>
                            <div
                                className={`message-bubble ${m.role === "user" ? "message-bubble-user" : "message-bubble-bot"
                                    } shadow-sm`}
                            >
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
                    <div ref={messagesEndRef} />
                </CardContent>
                <CardFooter className="border-t bg-white p-4">
                    <form onSubmit={onSubmit} className="input-form w-full">
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Type your message here..."
                            className="input-field"
                        />
                        <Button type="submit" disabled={isLoading} className="submit-button">
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send message</span>
                        </Button>
                    </form>
                </CardFooter>
            </Card>

            {/* Data Preview */}
            {Object.keys(collectedData).length > 0 && (
                <Card className="w-full max-w-2xl mt-4 shadow-md">
                    <CardHeader className="border-b">
                        <CardTitle className="text-[var(--color-primary)] text-sm">Collected Information</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-2">
                            {Object.entries(collectedData).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                    <span className="font-medium capitalize text-[var(--color-text-secondary)]">{key}:</span>
                                    <span className="text-[var(--color-text-primary)]">{value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

