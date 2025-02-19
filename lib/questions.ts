// Define the questions and validation rules
export const questions = [
    {
        question: "What's your name?",
        type: "text"
    },
    {
        question: "What's your current employment status? (Employed, Self-employed, Unemployed, Student, Retired)",
        type: "choice",
        options: ["Employed", "Self-employed", "Unemployed", "Student", "Retired"],
    },
    {
        question: "What's your annual income? (Please provide a number)",
        type: "text",
    },
    {
        question: "Do you have any outstanding debts? If yes, please list the types and amounts.",
        type: "text",
    },
    {
        question: "What are your monthly expenses? (Please provide an estimate)",
        type: "text",
    },
    {
        question: "Do you have any savings or investments? If yes, please specify the amounts.",
        type: "text",
    },
    {
        question: "What are your financial goals for the next 5 years?",
        type: "text",
    },
]
