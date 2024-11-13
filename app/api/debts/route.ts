import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function POST(req: Request) {
  const { creditorName, debtType, balance, interestRate } = await req.json();

  try {
    const [result] = await pool.query(
      'INSERT INTO debts (user_id, creditor_name, debt_type, balance, interest_rate) VALUES (?, ?, ?, ?, ?)',
      [1, creditorName, debtType, balance, interestRate] // Replace 1 with actual user_id when you implement authentication
    );

    return NextResponse.json({ message: 'Debt information saved successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error saving debt information' }, { status: 500 });
  }
}