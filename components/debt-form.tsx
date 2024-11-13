'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'

const formSchema = z.object({
  creditorName: z.string().min(2, {
    message: "Creditor name must be at least 2 characters.",
  }),
  debtType: z.enum(["credit_card", "personal_loan", "line_of_credit", "other"]),
  balance: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Balance must be a valid number.",
  }),
  interestRate: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Interest rate must be a valid number.",
  }),
})

export function DebtForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creditorName: "",
      debtType: "credit_card",
      balance: "",
      interestRate: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // TODO: Implement the API call to save the debt information
    console.log(values)
    toast({
      title: "Debt information submitted",
      description: "Your debt information has been saved successfully.",
    })
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="creditorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Creditor Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter creditor name" {...field} />
              </FormControl>
              <FormDescription>
                The name of the institution or person you owe money to.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="debtType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Debt Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
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
              <FormDescription>
                The type of revolving debt you're recording.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Balance</FormLabel>
              <FormControl>
                <Input placeholder="Enter current balance" {...field} />
              </FormControl>
              <FormDescription>
                The current amount you owe on this debt.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="interestRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interest Rate (%)</FormLabel>
              <FormControl>
                <Input placeholder="Enter interest rate" {...field} />
              </FormControl>
              <FormDescription>
                The annual interest rate for this debt.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit Debt Information</Button>
      </form>
    </Form>
  )
}