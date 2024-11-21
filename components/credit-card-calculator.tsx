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
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, DollarSignIcon, CreditCard, PercentIcon } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useToast } from "@/components/ui/use-toast"

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

export default function CreditCardCalculator() {
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [earlyPayoffSummary, setEarlyPayoffSummary] = useState<Summary | null>(null)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      principal: 1000,
      apr: 18,
      monthlyInterestRate: 1.5,
      minimumPayment: 25,
      additionalPayment: 0,
      requiredPrincipalPercentage: 10, // Updated default value
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
        action: <Button onClick={calculateEarlyPayoff}>Pay off earlier</Button>,
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

  function calculateEarlyPayoff() {
    const values = form.getValues()
    let increasedPayment = values.minimumPayment + values.additionalPayment
    let targetMonths = Math.floor(summary!.monthsToPayoff * 0.75) // Aim for 25% faster payoff

    while (true) {
      const [_, calculatedSummary] = calculatePaymentSchedule({
        ...values,
        minimumPayment: increasedPayment,
        additionalPayment: 0,
      })

      if (calculatedSummary.monthsToPayoff <= targetMonths) {
        setEarlyPayoffSummary(calculatedSummary)
        toast({
          title: "Early Payoff Calculation",
          description: `Increase your monthly payment to ${currencyFormatter.format(increasedPayment)} to pay off in ${calculatedSummary.yearsToPayoff.toFixed(1)} years (${calculatedSummary.monthsToPayoff} months)`,
        })
        break
      }

      increasedPayment += 10 // Increase by $10 and try again
    }
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
            <form className="space-y-6">
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
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                <FormField
                  control={form.control}
                  name="requiredPrincipalPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Principal Payment (%)</FormLabel> {/* Updated FormLabel */}
                      <FormControl>
                        <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormDescription>
                        Minimum percentage of the balance to be paid each month. {/* Updated FormDescription */}
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
        <div className="space-y-8">
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Repayment Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="flex flex-col space-y-1.5 p-6 bg-secondary/10 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Time to Pay Off
                  </span>
                  <span className="text-2xl font-bold">{summary.yearsToPayoff.toFixed(1)} years</span>
                  <span className="text-xs text-muted-foreground">{summary.monthsToPayoff} months</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {earlyPayoffSummary && (
            <Card className="w-full max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Early Payoff Scenario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex flex-col space-y-1.5 p-6 bg-primary/10 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground flex items-center">
                      <DollarSignIcon className="mr-2 h-4 w-4" />
                      New Total Repayment
                    </span>
                    <span className="text-2xl font-bold">{currencyFormatter.format(earlyPayoffSummary.totalInterestPaid + earlyPayoffSummary.totalPrincipalPaid)}</span>
                    <span className="text-xs text-muted-foreground">Principal + Interest</span>
                  </div>
                  <div className="flex flex-col space-y-1.5 p-6 bg-destructive/10 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground flex items-center">
                      <ArrowUpIcon className="mr-2 h-4 w-4" />
                      New Total Interest
                    </span>
                    <span className="text-2xl font-bold">{currencyFormatter.format(earlyPayoffSummary.totalInterestPaid)}</span>
                    <span className="text-xs text-muted-foreground">{((earlyPayoffSummary.totalInterestPaid / earlyPayoffSummary.totalPrincipalPaid) * 100).toFixed(1)}% of principal</span>
                  </div>
                  <div className="flex flex-col space-y-1.5 p-6 bg-secondary/10 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      New Time to Pay Off
                    </span>
                    <span className="text-2xl font-bold">{earlyPayoffSummary.yearsToPayoff.toFixed(1)} years</span>
                    <span className="text-xs text-muted-foreground">{earlyPayoffSummary.monthsToPayoff} months</span>
                  </div>
                  <div className="flex flex-col space-y-1.5 p-6 bg-accent/10 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground flex items-center">
                      <ArrowDownIcon className="mr-2 h-4 w-4" />
                      Interest Saved
                    </span>
                    <span className="text-2xl font-bold">{currencyFormatter.format(summary.totalInterestPaid - earlyPayoffSummary.totalInterestPaid)}</span>
                    <span className="text-xs text-muted-foreground">{((summary.totalInterestPaid - earlyPayoffSummary.totalInterestPaid) / summary.totalInterestPaid * 100).toFixed(1)}% of original interest</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="w-full max-w-5xl mx-auto overflow-hidden">
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}