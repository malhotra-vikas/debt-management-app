"use client"

import type React from "react"
import { useChat } from "@ai-sdk/react"
import { useState, useRef, useEffect, useCallback } from "react"
import { ShieldCheck } from "lucide-react"
import { Send, Bot, Shield, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"


interface CollectedData {
    name?: string
    email?: string
    situation?: string
}

const initialMessage = {
    id: "initial-message",
    content: `Hello! I'm Merlin, your personal financial wizard. I work with Dealing With Debt and i am here to help you get debt-free. 
        Tell me what brings you here today? `,
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
            <Card className="w-full max-w-2xl shadow-sm border border-gray-100">
                {/* Header */}
                <CardHeader className="border-b space-y-4 pb-4">
                    <div className="flex justify-start gap-4 text-sm text-[var(--color-text-secondary)]">
                        <div className="flex items-center gap-2">
                            <Lock className="h-6 w-6" />
                            <span>Secure & Confidential</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="h-6 w-6" />
                            <span>Expert Financial Analysis</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Bot className="h-8 w-8 text-[var(--color-primary)]" />
                        <div>
                            <CardTitle className="text-xl font-bold text-[var(--color-primary)]">Merlin</CardTitle>
                            <div className="text-sm text-[var(--color-text-secondary)]">
                                Your Trusted Financial and Debt Analysis Assistant
                            </div>
                        </div>
                    </div>
                </CardHeader>

                {/* Chat Content */}
                <CardContent className="h-[60vh] overflow-y-auto p-4" id="chat-container">
                    <div className="space-y-4">
                        {messages.map((m) => (
                            <div key={m.id} className="message-container">
                                <div
                                    className={`message-bubble ${m.role === "user" ? "message-bubble-user ml-auto" : "message-bubble-bot"
                                        }`}
                                >
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message-container">
                                <div className="message-bubble message-bubble-bot">
                                    <div className="loader" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div ref={messagesEndRef} />
                </CardContent>

                {/* Input Form */}
                <CardFooter className="border-t p-4">
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
{/* 
            {Object.keys(collectedData).length > 0 && (
                <Card className="w-full max-w-2xl mt-4 shadow-sm border border-gray-100">
                    <CardHeader className="border-b py-3">
                        <CardTitle className="text-sm font-medium text-[var(--color-text-secondary)]">
                            Collected Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-2 text-sm">
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
*/}            

            {/* Footer Trust Message */}
            <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)] max-w-md">
                Your information is protected and will only be used to provide you with the best possible financial guidance.
            </div>
        </div>
    )
}

