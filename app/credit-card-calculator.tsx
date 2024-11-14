'use client'

import React, { useState } from 'react'
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

const formSchema = z.object({
  principal: z.number().min(1, "Principal must be greater than 0"),
  apr: z.number().min(0, "APR must be 0 or greater").max(100, "APR must be 100 or less"),
  minimumPayment: z.number().min(1, "Minimum payment must be greater than 0"),
})

type FormValues = z.infer<typeof formSchema>

type PaymentScheduleItem = {
  month: number
  balance: number
  payment: number
  principal: number
  interest: number
}

export default function CreditCardCalculator() {
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      principal: 1000,
      apr: 18,
      minimumPayment: 25,
    },
  })

  function calculatePaymentSchedule(values: FormValues) {
    let balance = values.principal
    const monthlyRate = values.apr / 100 / 12
    const schedule: PaymentScheduleItem[] = []
    let month = 0

    while (balance > 0) {
      month++
      const interest = balance * monthlyRate
      let payment = Math.max(values.minimumPayment, balance * 0.01) // Minimum payment or 1% of balance, whichever is higher
      payment = Math.min(payment, balance + interest) // Don't overpay
      const principal = payment - interest
      balance -= principal

      schedule.push({
        month,
        balance: parseFloat(balance.toFixed(2)),
        payment: parseFloat(payment.toFixed(2)),
        principal: parseFloat(principal.toFixed(2)),
        interest: parseFloat(interest.toFixed(2)),
      })

      if (month > 600) break // Safeguard against infinite loops
    }

    setPaymentSchedule(schedule)
  }

  function onSubmit(values: FormValues) {
    calculatePaymentSchedule(values)
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

      {paymentSchedule.length > 0 && (
        <Card className="w-full max-w-4xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Payment Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Credit Card Payment Schedule</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Remaining Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentSchedule.map((item) => (
                  <TableRow key={item.month}>
                    <TableCell>{item.month}</TableCell>
                    <TableCell>${item.payment.toFixed(2)}</TableCell>
                    <TableCell>${item.principal.toFixed(2)}</TableCell>
                    <TableCell>${item.interest.toFixed(2)}</TableCell>
                    <TableCell>${item.balance.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}