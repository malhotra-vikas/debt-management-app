'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { toast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const formSchema = z.object({
  creditorName: z.string().min(2, {
    message: "Creditor name must be at least 2 characters.",
  }),
  debtType: z.enum(["credit_card", "personal_loan", "line_of_credit", "other"]),
  balance: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Balance must be a valid number.",
  }),
  interestRate: z.number().min(0).max(100),
})

export function DebtForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creditorName: "",
      debtType: "credit_card",
      balance: "",
      interestRate: 0,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    toast({
      title: "Debt information submitted",
      description: "Your debt information has been saved successfully.",
    })
    form.reset()
  }

  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="bg-blue-500 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-center">Debt Information</CardTitle>
        </CardHeader>
        <CardContent className="bg-white rounded-b-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="creditorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-600 font-semibold">Creditor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter creditor name" {...field} className="border-blue-300 focus:border-blue-500" />
                    </FormControl>
                    <FormDescription className="text-gray-500">
                      The name of the institution or person you owe money to.
                    </FormDescription>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="debtType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-600 font-semibold">Debt Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-blue-300 focus:border-blue-500">
                          <SelectValue placeholder="Select a debt type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="personal_loan">Personal Loan</SelectItem>
                        <SelectItem value="line_of_credit">Line of Credit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-gray-500">
                      The type of revolving debt you're recording.
                    </FormDescription>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-600 font-semibold">Current Balance</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter current balance" {...field} className="border-blue-300 focus:border-blue-500" />
                    </FormControl>
                    <FormDescription className="text-gray-500">
                      The current amount you owe on this debt.
                    </FormDescription>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interestRate"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel className="text-blue-600 font-semibold">Interest Rate (%)</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <Slider
                          min={0}
                          max={100}
                          step={0.1}
                          value={[value]}
                          onValueChange={(vals) => onChange(vals[0])}
                          className="w-full"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">0%</span>
                          <span className="text-lg font-semibold text-blue-600">{value.toFixed(1)}%</span>
                          <span className="text-sm text-gray-500">100%</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription className="text-gray-500">
                      The annual interest rate for this debt.
                    </FormDescription>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">Submit Debt Information</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}