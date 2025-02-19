"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, User, Check, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
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
    const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit, append, isLoading } = useChat()
    const [showOptions, setShowOptions] = useState(false)
    const [options, setOptions] = useState<Option[]>([])
    const [isMultiSelect, setIsMultiSelect] = useState(false)
    const [questionType, setQuestionType] = useState<string>("")
    const messagesEndRef = useRef<HTMLDivElement>(null)

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
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn("message-container", {
                    "mb-4": hasOptions && isLatestQuestion,
                    "mb-6": !hasOptions || !isLatestQuestion,
                })}
            >
                <div className="flex items-start">
                    {message.role === "assistant" && <Bot className="mr-2 h-6 w-6 text-blue-500" />}
                    <div
                        className={cn(
                            "message-bubble",
                            message.role === "assistant" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800",
                        )}
                    >
                        {question}
                    </div>
                    {message.role === "user" && <User className="ml-2 h-6 w-6 text-gray-500" />}
                </div>
                {showOptions && isLatestQuestion && (
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="options-container mt-4"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                {options.map((option) => (
                                    <motion.div key={option.number} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Card
                                            className={cn("option-card cursor-pointer", option.selected && "option-card-selected")}
                                            onClick={() => handleOptionClick(option)}
                                        >
                                            <CardContent className="option-content">
                                                <div className={cn("option-number", option.selected && "option-number-selected")}>
                                                    {option.selected ? <Check className="h-5 w-5" /> : <span>{option.number}</span>}
                                                </div>
                                                <p className="option-text">{option.text}</p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                            {isMultiSelect && (
                                <Button onClick={() => handleSelectionDone(options)} className="w-full mt-2 done-button">
                                    Done
                                </Button>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </motion.div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-white shadow-sm py-4 px-6">
                <h1 className="text-2xl font-bold text-gray-800">Merlin Assistant</h1>
            </header>
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto p-6" id="chat-container">
                    {messages.map((message, index) => (
                        <MessageContent
                            key={message.id}
                            message={message}
                            isLatestQuestion={index === messages.length - 1 && message.role === "assistant"}
                        />
                    ))}
                    {isLoading && (
                        <div className="flex items-center justify-center py-4">
                            <div className="loader"></div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <footer className="bg-white border-t border-gray-200 p-4">
                {(!showOptions || questionType === "text") && (
                    <form onSubmit={handleFormSubmit} className="flex space-x-2">
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Type your answer..."
                            className="flex-1 bg-gray-100 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                )}
            </footer>
        </div>
    )
}

