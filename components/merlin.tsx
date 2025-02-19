"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, User, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
    text: string
    value: string
}

export default function QuestionBot() {
    const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, append } = useChat()
    const [showOptions, setShowOptions] = useState(false)
    const [options, setOptions] = useState<Option[]>([])
    const [selectedOption, setSelectedOption] = useState<Option | null>(null)

    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            if (lastMessage.role === "assistant") {
                // Reset selection for new questions
                setSelectedOption(null)

                const optionsMatch = lastMessage.content.match(/OPTIONS:\s*((?:(?:\d+\.\s*)[^.]+\.?\s*)+)/i)
                if (optionsMatch) {
                    const optionsText = optionsMatch[1]
                    const optionsList = optionsText
                        .split(/(?=\d+\.)/)
                        .filter(Boolean)
                        .map((option) => {
                            const trimmed = option.trim()
                            const text = trimmed.replace(/^\d+\.\s*/, "").trim()
                            return { text, value: text }
                        })
                    setOptions(optionsList)
                    setShowOptions(true)
                } else {
                    setShowOptions(false)
                }
            }
        }
    }, [messages])

    const handleOptionClick = async (option: Option) => {
        setSelectedOption(option)

        // Small delay to show the selection before sending
        setTimeout(async () => {
            append({ role: "user", content: option.value })
            setShowOptions(false)
            await fetchNextQuestion(option.value)
        }, 500)
    }

    const fetchNextQuestion = async (userResponse: string) => {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ messages: [...messages, { role: "user", content: userResponse }] }),
        })

        if (response.ok) {
            const data = await response.json()
            append({
                role: "assistant",
                content: data.message,
            })
        }
    }

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (showOptions) {
            setShowOptions(false)
        }

        await originalHandleSubmit(e)
        fetchNextQuestion(input)
    }

    const MessageContent = ({ message }: { message: { role: string; content: string; id: string } }) => {
        const isQuestion = message.role === "assistant"
        const questionText = isQuestion ? message.content.split("OPTIONS:")[0].trim() : message.content
        const hasOptions = isQuestion && message.content.includes("OPTIONS:")

        return (
            <>
                <div className={`flex items-start mb-${hasOptions ? "2" : "4"}`}>
                    {message.role === "assistant" && <Bot className="mr-2 h-6 w-6 text-gray-500" />}
                    <div
                        className={`rounded-lg p-4 max-w-md ${message.role === "assistant" ? "bg-gray-100" : "bg-blue-500 text-white"
                            }`}
                    >
                        {questionText}
                    </div>
                    {message.role === "user" && <User className="ml-2 h-6 w-6 text-gray-500" />}
                </div>
                {hasOptions && showOptions && (
                    <div className="ml-8 mb-4">
                        <div className="grid grid-cols-2 gap-3">
                            {options.map((option, index) => (
                                <Card
                                    key={index}
                                    className={cn(
                                        "cursor-pointer transition-all duration-200 ease-in-out border-2",
                                        selectedOption?.value === option.value
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300",
                                    )}
                                    onClick={() => handleOptionClick(option)}
                                >
                                    <CardContent className="flex items-center p-4">
                                        <div
                                            className={cn(
                                                "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full mr-3",
                                                selectedOption?.value === option.value ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600",
                                            )}
                                        >
                                            {selectedOption?.value === option.value ? (
                                                <Check className="h-5 w-5" />
                                            ) : (
                                                <span className="font-semibold">{index + 1}</span>
                                            )}
                                        </div>
                                        <p
                                            className={cn(
                                                "text-lg",
                                                selectedOption?.value === option.value ? "text-blue-700 font-medium" : "text-gray-700",
                                            )}
                                        >
                                            {option.text}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </>
        )
    }

    return (
        <div className="flex flex-col h-screen max-w-3xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Question Bot</h1>
            <div className="flex-1 overflow-y-auto mb-4">
                {messages.map((message) => (
                    <MessageContent key={message.id} message={message} />
                ))}
            </div>
            {!showOptions && (
                <form onSubmit={handleFormSubmit} className="flex space-x-2">
                    <Input value={input} onChange={handleInputChange} placeholder="Type your answer..." className="flex-1" />
                    <Button type="submit">Send</Button>
                </form>
            )}
        </div>
    )
}

