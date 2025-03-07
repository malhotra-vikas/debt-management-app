interface Question {
    id: string
    question: string
    type: "text" | "options" | "multi-select"
    options?: string[]
    nextQuestion?: string | ((answer: string | string[]) => string)
  }
  
  export const questions: { [key: string]: Question } = {
    name: {
      id: "name",
      question: "What's your name?",
      type: "text",
      nextQuestion: "email",
    },
    email: {
      id: "email",
      question: "What's your email?",
      type: "text",
      nextQuestion: "life_events",
    },
    life_events: {
      id: "life_events",
      question: "Have you experienced any recent life events (Divorce, Death of Spouse, Child Birth, or similar)?",
      type: "options",
      options: ["Yes", "No"],
      nextQuestion: "catastrophic_loss",
    },
    catastrophic_loss: {
      id: "catastrophic_loss",
      question: "Have you experienced a catastrophic loss (house fire, or similar)?",
      type: "options",
      options: ["Yes", "No"],
      nextQuestion: "education_expenses",
    },
    education_expenses: {
      id: "education_expenses",
      question: "Do you have education expenses (tuition, student loans, etc.)?",
      type: "options",
      options: ["Yes", "No"],
      nextQuestion: "caring_family",
    },
    caring_family: {
      id: "caring_family",
      question: "Are you caring for extended family members (aging parents, children, etc.)?",
      type: "options",
      options: ["Yes", "No"],
      nextQuestion: "credit_card_expenses",
    },
    credit_card_expenses: {
      id: "credit_card_expenses",
      question: "Are you financing daily living expenses on credit cards?",
      type: "options",
      options: ["Yes", "No"],
      nextQuestion: "assets",
    },
    assets: {
      id: "assets",
      question: "Choose All That Apply to You",
      type: "multi-select",
      options: ["I own a home", "I have savings"],
      nextQuestion: (answers: string[]) => {
        if (answers.includes("I own a home") && answers.includes("I have savings")) {
          return "home_equity"
        } else if (answers.includes("I own a home")) {
          return "home_equity"
        } else if (answers.includes("I have savings")) {
          return "savings_amount"
        }
        return "situation_description"
      },
    },
    home_equity: {
      id: "home_equity",
      question: "How Much Equity Is In Your Home?",
      type: "text",
      nextQuestion: (answers: string[]) => {
        // Check if user has savings from previous question
        const previousAnswers = answers.find((a) => a.includes("I have savings"))
        return previousAnswers ? "savings_amount" : "situation_description"
      },
    },
    savings_amount: {
      id: "savings_amount",
      question: "How Much do you have in savings?",
      type: "text",
      nextQuestion: "situation_description",
    },
    situation_description: {
      id: "situation_description",
      question: "Which Do You Feel Best Describes Your Situation?",
      type: "options",
      options: ["I need short-term assistance", "I'm in over my head. I will never catch up"],
      nextQuestion: "employment_status",
    },
    employment_status: {
      id: "employment_status",
      question: "Are you currently employed?",
      type: "options",
      options: ["Yes", "No"],
      nextQuestion: (answer: string) => {
        return answer === "Yes" ? "income_sources" : "annual_income"
      },
    },
    income_sources: {
      id: "income_sources",
      question: "What are your current income sources?",
      type: "multi-select",
      options: ["Full Time (Salaried)", "Full Time (Hourly)"],
      nextQuestion: "unsecured_debt",
    },
    unsecured_debt: {
      id: "unsecured_debt",
      question: "Which of these Unsecured Debt do you carry?",
      type: "multi-select",
      options: ["Credit Card", "Personal Loan", "Medical Bill", "Student Loan", "Other unsecured Loan"],
      nextQuestion: "annual_income",
    },
    annual_income: {
      id: "annual_income",
      question: "What's your annual income? (Please provide a number)",
      type: "text",
      nextQuestion: "outstanding_debts",
    },
    outstanding_debts: {
      id: "outstanding_debts",
      question: "Do you have any outstanding debts? If yes, please list the types and amounts.",
      type: "text",
      nextQuestion: "monthly_expenses",
    },
    monthly_expenses: {
      id: "monthly_expenses",
      question: "What are your monthly expenses? (Please provide an estimate)",
      type: "text",
      nextQuestion: "financial_goals",
    },
    financial_goals: {
      id: "financial_goals",
      question: "What are your financial goals for the next 5 years?",
      type: "text",
      nextQuestion: null,
    },
  }
  
  export const FIRST_QUESTION = "name"