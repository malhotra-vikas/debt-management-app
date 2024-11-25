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
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, DollarSignIcon, CreditCard, PercentIcon, ArrowRightIcon, Info } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Tooltip as TooltipComponent,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formSchema = z.object({
  principal: z.number().min(1, "Principal must be greater than 0"),
  apr: z.number().min(0, "APR must be 0 or greater").max(100, "APR must be 100 or less"),
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

function InfoTooltip({ content }: { content: string }) {
  return (
    <TooltipProvider>
      <TooltipComponent>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 ml-1 inline-block text-muted-foreground hover:text-primary cursor-help transition-colors" />
        </TooltipTrigger>
        <TooltipContent 
          className="bg-popover text-popover-foreground shadow-lg rounded-md px-3 py-2 text-sm max-w-xs"
          sideOffset={5}
        >
          <p>{content}</p>
        </TooltipContent>
      </TooltipComponent>
    </TooltipProvider>
  )
}

export default function CreditCardCalculator() {
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [showChart, setShowChart] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [email, setEmail] = useState('');
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      principal: 1000,
      apr: 18,
      minimumPayment: 15,
      additionalPayment: 0,
      requiredPrincipalPercentage: 1.5,
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
    const monthlyRate = (values.apr / 100) / 12
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
      <Card className="w-full max-w-4xl mx-auto">
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
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center group">
                        Outstanding Principal Balance ($)
                        <InfoTooltip content="The current balance outstanding of your credit card debt" />
                      </FormLabel>
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
                      <FormLabel className="flex items-center group">
                        APR (%)
                        <InfoTooltip content="Annual Percentage Rate - the yearly interest rate on your credit card" />
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="additionalPayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center group">
                        Additional Monthly Payment ($)
                        <InfoTooltip content="Enter an additional amount you could pay each month to become debt-free faster." />
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minimumPayment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center group">
                      Alternative Minimum Payment ($)
                        <InfoTooltip content="Defined in the card agreement, this is lowest minimum payment the issuer accepts for cards with a balance. If your balance falls below this number the balance becomes the minimum payment. By default we have this set at $15" />
                      </FormLabel>
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
                      <FormLabel className="flex items-center group">
                        Minimum Principal Payment (%)
                        <InfoTooltip content="Defined in the card agreement, this is the percent of your outstanding balance the issuer requires you to pay each month. It is usually between 1% and 3% By default we have this set at 1.5%" />
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
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
              <div className="mt-4 text-center flex justify-center space-x-4">
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="group text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 transition-colors"
                    >
                      Get Debt Free Faster
                      <ArrowRightIcon className="inline-block ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div>
                      <h3 className="font-semibold mb-2">Add extra monthly payment</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">$</span>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          className="w-32"
                          min="0"
                          step="0.01"
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              form.setValue('additionalPayment', value);
                            }
                          }}
                        />
                        <Button 
                          onClick={() => setPopoverOpen(false)}
                          variant="outline"
                        >
                          Add
                        </Button>
                      </div>
                      {form.getValues('additionalPayment') > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          With an extra ${form.getValues('additionalPayment')}/month, you could be debt-free by {calculateDebtFreeDate(summary.monthsToPayoff)}, 
                          saving {currencyFormatter.format(summary.totalInterestPaid)} in interest!
                        </p>
                      )}
                    </div>
                    <Separator className="my-4" />
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">Email me my report</h3>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="flex-grow"
                        />
                        <Button 
                          onClick={() => {
                            // TODO: Implement email sending functionality
                            toast({
                              title: "Report Sent",
                              description: `A report has been sent to ${email}`,
                            });
                            setPopoverOpen(false);
                          }}
                          variant="outline"
                        >
                          Send Report
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full max-w-4xl mx-auto overflow-hidden">
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
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto relative">
                  <Table className="relative">
                    <TableHeader className="relative bg-background z-10">
                      <TableRow className="bg-muted/50 sticky top-0">
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