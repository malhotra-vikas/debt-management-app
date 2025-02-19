// Define the questions and validation rules
export const questions = [
    {
        question: "What's your name?",
        type: "text"
    },
    {
        question: "What's your email?",
        type: "text"
    },
    {
        question: "Have you experienced any recent life events (Divorce, Death of Spouse, Child Birth, or similar)?",
        type: "options",
        options: ["Yes", "No"],
    },
    {
        question: "Have you experienced a catastrophic loss (house fire, or similar)?",
        type: "options",
        options: ["Yes", "No"],
    },
    {
        question: "Do you have education expenses (tuition, student loans, etc.)?",
        type: "options",
        options: ["Yes", "No"],
    }, 
    {
        question: "Are you caring for extended family members (aging parents, children, etc.)?",
        type: "options",
        options: ["Yes", "No"],
    }, 
    {
        question: "Are you financing daily living expenses on credit cards?",
        type: "options",
        options: ["Yes", "No"],
    }, 
    {
        question: "Choose All That Apply to You",
        type: "multi-select",
        options: ["I own a home", "I have savings"],
    }, 
    {
        question: "How Much Equity Is In Your Home?",
        type: "text",
    },
    {
        question: "Which of these Unsecured Debt do you carry?",
        type: "multi-select",
        options: ["Credit Card", "Personal Loan", "Medical Bill", "Student Loan", "Other unsecured Loan"],
    },
    {
        question: "What's your current employment status? (Employed, Self-employed, Unemployed, Student, Retired)",
        type: "options",
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
