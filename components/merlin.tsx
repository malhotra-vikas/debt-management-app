"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, User } from "lucide-react"

export default function QuestionBot() {
    const { messages, input, handleInputChange, handleSubmit, append } = useChat()
    const [showOptions, setShowOptions] = useState(false)
    const [options, setOptions] = useState<string[]>([])

    useEffect(() => {
        console.log(messages)
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            if (lastMessage.role === "assistant") {
                const optionsMatch = lastMessage.content.match(/OPTIONS:(.*)/i)
                if (optionsMatch) {
                    const optionsList = optionsMatch[1].split(",").map((option) => option.trim())
                    setOptions(optionsList)
                    setShowOptions(true)
                } else {
                    setShowOptions(false)
                }
            }
        }
    }, [messages])

    const handleOptionClick = (option: string) => {
        append({ role: "user", content: option })
        setShowOptions(false)
    }

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (showOptions) {
            setShowOptions(false)
        }
        handleSubmit(e)
    }

    return (
        <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Question Bot</h1>
            <div className="flex-1 overflow-y-auto mb-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex items-start mb-4 ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                    >
                        {message.role === "assistant" && <Bot className="mr-2 h-6 w-6 text-gray-500" />}
                        <div
                            className={`rounded-lg p-2 max-w-xs ${message.role === "assistant" ? "bg-gray-200" : "bg-blue-500 text-white"
                                }`}
                        >
                            {message.role === "assistant" ? message.content.replace(/OPTIONS:.*$/i, "").trim() : message.content}
                        </div>
                        {message.role === "user" && <User className="ml-2 h-6 w-6 text-gray-500" />}
                    </div>
                ))}
                {showOptions && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {options.map((option, index) => (
                            <Card key={index} className="cursor-pointer hover:bg-gray-100" onClick={() => handleOptionClick(option)}>
                                <CardContent className="p-2 text-center">{option}</CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
            <form onSubmit={handleFormSubmit} className="flex space-x-2">
                <Input value={input} onChange={handleInputChange} placeholder="Type your answer..." className="flex-1" />
                <Button type="submit">Send</Button>
            </form>
        </div>
    )
}

