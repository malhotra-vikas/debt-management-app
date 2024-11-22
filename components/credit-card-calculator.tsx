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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, DollarSignIcon, CreditCard, PercentIcon } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formSchema = z.object({
  principal: z.number().min(1, "Principal must be greater than 0"),
  apr: z.number().min(0, "APR must be 0 or greater").max(100, "APR must be 100 or less"),
  monthlyInterestRate: z.number().min(0, "Monthly interest rate must be 0 or greater"),
  minimumPayment: z.number().min(1, "Minimum payment must be greater than 0"),
  additionalPayment: z.number().min(0, "Additional payment must be 0 or greater"),
  requiredPrincipalPercentage: z.number().min(0, "Percentage must be 0 or greater").max(100, "Percentage must be 100 or less"),
})

type FormValues = z.infer<typeof formSchema>

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

function calculateDebtFreeDate(monthsToPayoff: number): string {
  const today = new Date();
  const debtFreeDate = new Date(today.setMonth(today.getMonth() + monthsToPayoff));
  return debtFreeDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function CreditCardCalculator() {
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [earlyPayoffSummary, setEarlyPayoffSummary] = useState<Summary | null>(null)
  const [showChart, setShowChart] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      principal: 1000,
      apr: 18,
      monthlyInterestRate: 1.5,
      minimumPayment: 25,
      additionalPayment: 0,
      requiredPrincipalPercentage: 1,
    },
  })

  useEffect(() => {
    const apr = form.watch('apr')
    form.setValue('monthlyInterestRate', parseFloat((apr / 12).toFixed(3)))
  }, [form.watch('apr')])

  useEffect(() => {
    const values = form.getValues()
    const [schedule, calculatedSummary] = calculatePaymentSchedule(values)
    setPaymentSchedule(schedule)
    setSummary(calculatedSummary)

    if (calculatedSummary) {
      toast({
        title: "Time to Pay Off",
        description: `${calculatedSummary.yearsToPayoff.toFixed(1)} years (${calculatedSummary.monthsToPayoff} months)`,
      })
    }
  }, [form.watch('principal'), form.watch('apr'), form.watch('minimumPayment'), form.watch('additionalPayment'), form.watch('requiredPrincipalPercentage')])

  function calculatePaymentSchedule(values: FormValues): [PaymentScheduleItem[], Summary] {
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
      const requiredPrincipal = balance * (values.requiredPrincipalPercentage / 100)
      let payment = Math.max(values.minimumPayment, interest + requiredPrincipal) + values.additionalPayment
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

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center">
            <CreditCard className="mr-2 h-6 w-6" />
            Credit Card Debt Calculator
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Calculate your credit card debt repayment plan and see how additional payments can help you become debt-free faster.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principal Amount ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>APR (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
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
                      <FormDescription>Automatically calculated as APR / 12</FormDescription>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requiredPrincipalPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Principal Payment (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormDescription>
                        Minimum percentage of the balance to be paid each month.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Separator className="my-4" />
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="additionalPayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Monthly Payment ($)</FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={500}
                          step={10}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                      </FormControl>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>$0</span>
                        <span>${field.value}</span>
                        <span>$500</span>
                      </div>
                      <FormDescription>
                        Adjust this slider to see how additional monthly payments can help you become debt-free faster.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {summary && (
        <div className="space-y-4">
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold">Repayment Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col space-y-1.5 p-6 bg-primary/10 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground flex items-center">
                    <DollarSignIcon className="mr-2 h-4 w-4" />
                    Total Repayment
                  </span>
                  <span className="text-2xl font-bold">{currencyFormatter.format(summary.totalInterestPaid + summary.totalPrincipalPaid)}</span>
                  <span className="text-xs text-muted-foreground">Principal + Interest</span>
                </div>
                <div className="flex flex-col space-y-1.5 p-6 bg-destructive/10 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground flex items-center">
                    <ArrowUpIcon className="mr-2 h-4 w-4" />
                    Total Interest
                  </span>
                  <span className="text-2xl font-bold">{currencyFormatter.format(summary.totalInterestPaid)}</span>
                  <span className="text-xs text-muted-foreground">{((summary.totalInterestPaid / summary.totalPrincipalPaid) * 100).toFixed(1)}% of principal</span>
                </div>
                <div className="flex flex-col space-y-1.5 p-6 bg-primary/10 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Time to Pay Off
                  </span>
                  <span className="text-2xl font-bold">{summary.yearsToPayoff.toFixed(1)} years</span>
                  <span className="text-xs text-muted-foreground">{summary.monthsToPayoff} months</span>
                </div>
                <div className="flex flex-col space-y-1.5 p-6 bg-green-100 dark:bg-green-900 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Debt Free Date
                  </span>
                  <span className="text-2xl font-bold">{calculateDebtFreeDate(summary.monthsToPayoff)}</span>
                  <span className="text-xs text-muted-foreground">Estimated payoff date</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full max-w-5xl mx-auto overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center justify-between">
                Payment Schedule
                <div className="flex items-center space-x-2">
                  <Label htmlFor="chart-view" className="text-sm font-normal">Chart View</Label>
                  <Switch
                    id="chart-view"
                    checked={showChart}
                    onCheckedChange={setShowChart}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {showChart ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={paymentSchedule}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => currencyFormatter.format(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="balance" stroke="#8884d8" name="Balance" />
                      <Line type="monotone" dataKey="payment" stroke="#82ca9d" name="Payment" />
                      <Line type="monotone" dataKey="interest" stroke="#ffc658" name="Interest" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-left font-semibold">Month</TableHead>
                        <TableHead className="text-right font-semibold">Starting Balance</TableHead>
                        <TableHead className="text-right font-semibold">Payment</TableHead>
                        <TableHead className="text-right font-semibold">Principal</TableHead>
                        <TableHead className="text-right font-semibold">Interest</TableHead>
                        <TableHead className="text-right font-semibold">Remaining Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentSchedule.map((item, index) => (
                        <TableRow key={item.month} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                          <TableCell className="text-left font-medium">{item.month}</TableCell>
                          <TableCell className="text-right">{currencyFormatter.format(item.startingBalance)}</TableCell>
                          <TableCell className="text-right">{currencyFormatter.format(item.payment)}</TableCell>
                          <TableCell className="text-right">{currencyFormatter.format(item.principal)}</TableCell>
                          <TableCell className="text-right">{currencyFormatter.format(item.interest)}</TableCell>
                          <TableCell className="text-right">{currencyFormatter.format(item.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}