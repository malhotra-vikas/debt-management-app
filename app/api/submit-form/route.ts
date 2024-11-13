import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

const dbConfig = {
  host: 'localhost',
  user: 'dealingwithdebt_dev',
  password: 'india@12345',
  database: 'debt_management',
}

export async function POST(request: NextRequest) {
  const { userInfo, allDebts, additionalInfo } = await request.json()

  try {
    const connection = await mysql.createConnection(dbConfig)

    // Insert user information
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, first_name, last_name, phone_number) VALUES (?, ?, ?, ?)',
      [userInfo.email, userInfo.firstName, userInfo.lastName, userInfo.phoneNumber]
    )
    const userId = (userResult as any).insertId

    // Insert debts
    for (const debt of allDebts) {
      const [debtTypeResult] = await connection.execute(
        'SELECT id FROM debt_types WHERE name = ?',
        [debt.type]
      )
      const debtTypeId = (debtTypeResult as any)[0].id

      await connection.execute(
        'INSERT INTO debts (user_id, debt_type_id, creditor_name, balance, interest_rate) VALUES (?, ?, ?, ?, ?)',
        [userId, debtTypeId, debt.creditorName, debt.balance, debt.interestRate]
      )
    }

    // Insert additional information
    await connection.execute(
      'INSERT INTO additional_info (user_id, short_term_loss, future_income_increase, future_income_amount, debt_situation, monthly_minimum_payments, has_savings, savings_amount, years_to_debt_free) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        additionalInfo.shortTermLoss,
        additionalInfo.futureIncomeIncrease,
        additionalInfo.futureIncomeAmount || null,
        additionalInfo.debtSituation,
        additionalInfo.monthlyMinimumPayments,
        additionalInfo.hasSavings,
        additionalInfo.savingsAmount || null,
        additionalInfo.yearsToDebtFree,
      ]
    )

    await connection.end()

    return NextResponse.json({ message: 'Data saved successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error saving data:', error)
    return NextResponse.json({ message: 'Error saving data' }, { status: 500 })
  }
}