"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, User, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import "@/styles/questionBot.css"

interface Option {
    text: string
    value: string
    number: number
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
                setSelectedOption(null)

                const optionsText = lastMessage.content
                const optionsMatch = optionsText.match(/OPTIONS:\s*(.+?)(?=\s*(?:Please choose|$))/is)

                if (optionsMatch) {
                    const optionsList = optionsMatch[1]
                        .split(/(?=\d+\.)/)
                        .filter(Boolean)
                        .map((option) => {
                            const match = option.match(/(\d+)\.\s*([^.]+)/)
                            if (match) {
                                const [, number, text] = match
                                return {
                                    number: Number.parseInt(number),
                                    text: text.trim(),
                                    value: text.trim(),
                                }
                            }
                            return null
                        })
                        .filter((option): option is Option => option !== null)

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
        setShowOptions(false) // Immediately hide options

        append({ role: "user", content: option.value })
        await fetchNextQuestion(option.value)
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
                <div
                    className={cn("message-container", {
                        "mb-4": hasOptions && showOptions,
                        "mb-6": !hasOptions || !showOptions,
                    })}
                >
                    {message.role === "assistant" && <Bot className="icon icon-bot" />}
                    <div
                        className={cn(
                            "message-bubble",
                            message.role === "assistant" ? "message-bubble-bot" : "message-bubble-user",
                        )}
                    >
                        {questionText}
                    </div>
                    {message.role === "user" && <User className="icon icon-user" />}
                </div>
                {hasOptions && showOptions && (
                    <div className="options-container grid grid-cols-1 gap-3">
                        {options.map((option) => (
                            <Card
                                key={option.number}
                                className={cn("option-card", selectedOption?.value === option.value && "option-card-selected")}
                                onClick={() => handleOptionClick(option)}
                            >
                                <CardContent className="option-content">
                                    <div
                                        className={cn("option-number", selectedOption?.value === option.value && "option-number-selected")}
                                    >
                                        {selectedOption?.value === option.value ? (
                                            <Check className="h-5 w-5" />
                                        ) : (
                                            <span>{option.number}</span>
                                        )}
                                    </div>
                                    <p className="option-text">{option.text}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </>
        )
    }

    return (
        <div className="question-bot flex flex-col h-screen max-w-3xl mx-auto p-4">
            <h1 className="question-bot-title">Question Bot</h1>
            <div className="flex-1 overflow-y-auto mb-4">
                {messages.map((message) => (
                    <MessageContent key={message.id} message={message} />
                ))}
            </div>
            {!showOptions && (
                <form onSubmit={handleFormSubmit} className="input-form">
                    <Input value={input} onChange={handleInputChange} placeholder="Type your answer..." className="input-field" />
                    <Button type="submit" className="submit-button">
                        Send
                    </Button>
                </form>
            )}
        </div>
    )
}

