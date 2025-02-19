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
    selected?: boolean
}

type Message = {
    role: string
    content: string
    id: string
}

export default function QuestionBot() {
    const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, append } = useChat()
    const [showOptions, setShowOptions] = useState(false)
    const [options, setOptions] = useState<Option[]>([])
    const [isMultiSelect, setIsMultiSelect] = useState(false)
    const [questionType, setQuestionType] = useState<string>("")

    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            if (lastMessage.role === "assistant") {
                const { question, type, options: parsedOptions } = parseMessage(lastMessage.content)
                setOptions(parsedOptions)
                setIsMultiSelect(type === "multi-select")
                setQuestionType(type)
                setShowOptions(parsedOptions.length > 0)
            }
        }
    }, [messages])

    const parseMessage = (content: string): { question: string; type: string; options: Option[] } => {
        const [question, type, optionsString] = content.split(":")
        let options: Option[] = []

        if (optionsString) {
            options = optionsString.split(",").map((option, index) => ({
                number: index + 1,
                text: option.trim(),
                value: option.trim(),
                selected: false,
            }))
        }

        return { question: question.trim(), type: type, options }
    }

    const handleOptionClick = (clickedOption: Option) => {
        if (isMultiSelect) {
            setOptions(
                options.map((option) =>
                    option.number === clickedOption.number ? { ...option, selected: !option.selected } : option,
                ),
            )
        } else {
            handleSelectionDone([{ ...clickedOption, selected: true }])
            setShowOptions(false)
        }
    }

    const handleSelectionDone = (selectedOptions: Option[]) => {
        const selectedValues = selectedOptions.filter((option) => option.selected).map((option) => option.value)

        const responseContent = selectedValues.join(", ")
        append({ role: "user", content: responseContent })
        setShowOptions(false)
        fetchNextQuestion(responseContent)
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

    const MessageContent = ({ message, isLatestQuestion }: { message: Message; isLatestQuestion: boolean }) => {
        const isQuestion = message.role === "assistant"
        const { question, type, options: messageOptions } = parseMessage(message.content)
        const hasOptions = isQuestion && messageOptions.length > 0

        return (
            <>
                <div
                    className={cn("message-container", {
                        "mb-4": hasOptions && isLatestQuestion,
                        "mb-6": !hasOptions || !isLatestQuestion,
                    })}
                >
                    {message.role === "assistant" && <Bot className="icon icon-bot" />}
                    <div
                        className={cn(
                            "message-bubble",
                            message.role === "assistant" ? "message-bubble-bot" : "message-bubble-user",
                        )}
                    >
                        {question}
                    </div>
                    {message.role === "user" && <User className="icon icon-user" />}
                </div>
                {showOptions && isLatestQuestion && (
                    <div className="options-container">
                        <div className="grid grid-cols-1 gap-3 mb-4">
                            {options.map((option) => (
                                <Card
                                    key={option.number}
                                    className={cn("option-card", option.selected && "option-card-selected")}
                                    onClick={() => handleOptionClick(option)}
                                >
                                    <CardContent className="option-content">
                                        <div className={cn("option-number", option.selected && "option-number-selected")}>
                                            {option.selected ? <Check className="h-5 w-5" /> : <span>{option.number}</span>}
                                        </div>
                                        <p className="option-text">{option.text}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        {isMultiSelect && (
                            <Button onClick={() => handleSelectionDone(options)} className="w-full mt-2 done-button">
                                Done
                            </Button>
                        )}
                    </div>
                )}
            </>
        )
    }

    return (
        <div className="question-bot flex flex-col h-screen max-w-3xl mx-auto p-4">
            <h1 className="question-bot-title">Question Bot</h1>
            <div className="flex-1 overflow-y-auto mb-4">
                {messages.map((message, index) => (
                    <MessageContent
                        key={message.id}
                        message={message}
                        isLatestQuestion={index === messages.length - 1 && message.role === "assistant"}
                    />
                ))}
            </div>
            {(!showOptions || questionType === "text") && (
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

