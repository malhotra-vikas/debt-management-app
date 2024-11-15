'use client'

import React, { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, DollarSignIcon } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const formSchema = z.object({
  principal: z.number().min(1, "Principal must be greater than 0"),
  apr: z.number().min(0, "APR must be 0 or greater").max(100, "APR must be 100 or less"),
  monthlyInterestRate: z.number().min(0, "Monthly interest rate must be 0 or greater"),
  minimumPayment: z.number().min(1, "Minimum payment must be greater than 0"),
})

const scenarioFormSchema = z.object({
  additionalPayment: z.number().min(0, "Additional payment must be 0 or greater"),
})

type FormValues = z.infer<typeof formSchema>
type ScenarioFormValues = z.infer<typeof scenarioFormSchema>

type PaymentScheduleItem = {
  month: number
  startingBalance: number
  balance: number
  payment: number
  principal: number
  interest: number
}

type Summary = {
  totalInterestPaid: number
  totalPrincipalPaid: number
  monthsToPayoff: number
  yearsToPayoff: number
}

export default function CreditCardCalculator() {
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [scenarioSummary, setScenarioSummary] = useState<Summary | null>(null)
  const [chartData, setChartData] = useState<any[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      principal: 1000,
      apr: 18,
      monthlyInterestRate: 1.5,
      minimumPayment: 25,
    },
  })

  const scenarioForm = useForm<ScenarioFormValues>({
    resolver: zodResolver(scenarioFormSchema),
    defaultValues: {
      additionalPayment: 0,
    },
  })

  useEffect(() => {
    const apr = form.watch('apr')
    form.setValue('monthlyInterestRate', parseFloat((apr / 12).toFixed(3)))
  }, [form.watch('apr')])

  function calculatePaymentSchedule(values: FormValues, additionalPayment: number = 0): [PaymentScheduleItem[], Summary] {
    let balance = values.principal
    const monthlyRate = values.monthlyInterestRate / 100
    const schedule: PaymentScheduleItem[] = []
    let month = 0
    let totalInterestPaid = 0
    let totalPrincipalPaid = 0

    while (balance > 0) {
      month++
      const startingBalance = balance
      const interest = balance * monthlyRate
      let payment = Math.max(values.minimumPayment, balance * 0.01) + additionalPayment
      payment = Math.min(payment, balance + interest)
      const principal = payment - interest
      balance -= principal

      totalInterestPaid += interest
      totalPrincipalPaid += principal

      schedule.push({
        month,
        startingBalance: parseFloat(startingBalance.toFixed(2)),
        balance: parseFloat(balance.toFixed(2)),
        payment: parseFloat(payment.toFixed(2)),
        principal: parseFloat(principal.toFixed(2)),
        interest: parseFloat(interest.toFixed(2)),
      })

      if (month > 600) break
    }

    const summary: Summary = {
      totalInterestPaid: parseFloat(totalInterestPaid.toFixed(2)),
      totalPrincipalPaid: parseFloat(totalPrincipalPaid.toFixed(2)),
      monthsToPayoff: month,
      yearsToPayoff: parseFloat((month / 12).toFixed(2)),
    }

    return [schedule, summary]
  }

  function onSubmit(values: FormValues) {
    const [schedule, calculatedSummary] = calculatePaymentSchedule(values)
    setPaymentSchedule(schedule)
    setSummary(calculatedSummary)
    setChartData(generateChartData(schedule, null))
  }

  function onScenarioSubmit(scenarioValues: ScenarioFormValues) {
    const formValues = form.getValues()
    const [_, calculatedScenarioSummary] = calculatePaymentSchedule(formValues, scenarioValues.additionalPayment)
    setScenarioSummary(calculatedScenarioSummary)
    setChartData(generateChartData(paymentSchedule, calculatedScenarioSummary))
  }

  function generateChartData(schedule: PaymentScheduleItem[], scenarioSummary: Summary | null) {
    const data = schedule.filter((_, index) => index % 12 === 0).map(item => ({
      month: item.month,
      balance: item.balance,
    }))

    if (scenarioSummary) {
      const scenarioData = Array.from({ length: Math.ceil(scenarioSummary.monthsToPayoff / 12) }, (_, i) => ({
        month: (i + 1) * 12,
        scenarioBalance: Math.max(0, form.getValues().principal * (1 - (i + 1) / Math.ceil(scenarioSummary.monthsToPayoff / 12))),
      }))
      
      return data.map(item => ({
        ...item,
        scenarioBalance: scenarioData.find(d => d.month === item.month)?.scenarioBalance || 0,
      }))
    }

    return data
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Credit Card Debt Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="principal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormDescription>
                      Enter the current balance on your credit card.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Percentage Rate (APR) (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormDescription>
                      Enter the APR for your credit card.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthlyInterestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Interest Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" {...field} readOnly />
                    </FormControl>
                    <FormDescription>
                      This is automatically calculated as APR / 12.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minimumPayment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Monthly Payment ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormDescription>
                      Enter the minimum monthly payment for your credit card.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Calculate</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {summary && (
        <div className="mt-8 space-y-8">
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Repayment Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Repayment
                    </CardTitle>
                    <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${(summary.totalInterestPaid + summary.totalPrincipalPaid).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Principal + Interest
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Interest
                    </CardTitle>
                    <ArrowUpIcon className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${summary.totalInterestPaid.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {((summary.totalInterestPaid / summary.totalPrincipalPaid) * 100).toFixed(1)}% of principal
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Time to Pay Off
                    </CardTitle>
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summary.yearsToPayoff.toFixed(1)} years
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summary.monthsToPayoff} months
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Payoff Progress
                    </CardTitle>
                    <ArrowDownIcon className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <Progress 
                      value={100} 
                      className="w-full mt-2"
                      aria-label="100% of debt paid off"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      100% paid off at the end
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Payment Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Principal</p>
                  <p className="text-2xl font-bold">${summary.totalPrincipalPaid.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Interest</p>
                  <p className="text-2xl font-bold">${summary.totalInterestPaid.toFixed(2)}</p>
                </div>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-green-500"
                  style={{ width: `${(summary.totalPrincipalPaid / (summary.totalPrincipalPaid + summary.totalInterestPaid)) * 100}%` }}
                />
                <div 
                  className="h-full bg-red-500 -mt-4"
                  style={{ width: `${(summary.totalInterestPaid / (summary.totalPrincipalPaid + summary.totalInterestPaid)) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>Principal</span>
                <span>Interest</span>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Want to be debt-free earlier?</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...scenarioForm}>
                <form onSubmit={scenarioForm.handleSubmit(onScenarioSubmit)} className="space-y-8">
                  <FormField
                    control={scenarioForm.control}
                    name="additionalPayment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Monthly Payment ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormDescription>
                          Enter an additional amount you could pay each month to become debt-free faster.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Calculate Scenario</Button>
                </form>
              </Form>
              {scenarioSummary && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold">New Payoff Time</h3>
                  <p>{scenarioSummary.yearsToPayoff.toFixed(1)} years ({scenarioSummary.monthsToPayoff} months)</p>
                  <h3 className="text-lg font-semibold mt-2">Total Interest Saved</h3>
                  <p>${(summary.totalInterestPaid - scenarioSummary.totalInterestPaid).toFixed(2)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Balance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="balance" stroke="#8884d8" name="Current Plan" />
                    {scenarioSummary && (
                      <Line type="monotone" dataKey="scenarioBalance" stroke="#82ca9d" name="With Additional Payment" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full max-w-5xl mx-auto mt-8 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Payment Schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption>Credit Card Payment Schedule</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Month</TableHead>
                      <TableHead className="text-right">Starting Balance</TableHead>
                      <TableHead className="text-right">Payment</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right">Remaining Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentSchedule.map((item) => (
                      <TableRow key={item.month}>
                        <TableCell className="text-left">{item.month}</TableCell>
                        <TableCell className="text-right">${item.startingBalance.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.payment.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.principal.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.interest.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.balance.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}