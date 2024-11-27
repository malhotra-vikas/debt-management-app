'use client'

import React, { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, DollarSignIcon, CreditCard, PercentIcon, ArrowRightIcon, Info, Send, FileDown } from 'lucide-react'
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
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer'
import { pdf } from '@react-pdf/renderer'

// Import the CSS file
import '@/styles/credit-card-calculator.css'

// Register a custom font for the PDF
Font.register({
  family: 'CustomFont',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2', fontWeight: 700 },
  ],
})

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
  cumulativePrincipal: number
  cumulativeInterest: number
  requiredMinimumPayment: number
  totPaid: number
}

type Summary = {
  totalInterestPaid: number
  totalPrincipalPaid: number
  monthsToPayoff: number
  yearsToPayoff: number
}

function calculateDebtFreeDate(monthsToPayoff: number): string {
  const today = new Date()
  const debtFreeDate = new Date(today.setMonth(today.getMonth() + monthsToPayoff))
  return debtFreeDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
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

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'CustomFont',
    color: '#002A65'
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#72A967',
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableCol: {
    width: '16.66%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#72A967',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
  },
  tableCell: {
    margin: 'auto',
    marginTop: 5,
    marginBottom: 5,
    fontSize: 10,
  },
  dashboardItem: {
    marginBottom: 10,
  },
  dashboardLabel: {
    fontSize: 10,
  },
  dashboardValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dashboardSubtext: {
    fontSize: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  tipText: {
    fontSize: 10,
    marginBottom: 5,
  },
})

const PDFReport = ({ summary, paymentSchedule }: { summary: Summary, paymentSchedule: PaymentScheduleItem[] }) => {
  try {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.title}>Credit Card Debt Repayment Report</Text>
            <Text style={styles.subtitle}>Summary</Text>
            <Text style={styles.text}>Total Paid: {currencyFormatter.format(summary.totalInterestPaid + summary.totalPrincipalPaid)}</Text>
            <Text style={styles.text}>Total Interest Paid: {currencyFormatter.format(summary.totalInterestPaid)}</Text>
            <Text style={styles.text}>Total Principal Paid: {currencyFormatter.format(summary.totalPrincipalPaid)}</Text>
            <Text style={styles.text}>Time to Pay Off: {summary.yearsToPayoff.toFixed(1)} years ({summary.monthsToPayoff} months)</Text>
            <Text style={styles.text}>Debt Free Date: {calculateDebtFreeDate(summary.monthsToPayoff)}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.subtitle}>Repayment Dashboard</Text>
            <View style={styles.dashboardItem}>
              <Text style={styles.dashboardLabel}>Total Paid</Text>
              <Text style={styles.dashboardValue}>{currencyFormatter.format(summary.totalInterestPaid + summary.totalPrincipalPaid)}</Text>
              <Text style={styles.dashboardSubtext}>Principal + Interest</Text>
            </View>
            <View style={styles.dashboardItem}>
              <Text style={styles.dashboardLabel}>Total Interest Paid</Text>
              <Text style={styles.dashboardValue}>{currencyFormatter.format(summary.totalInterestPaid)}</Text>
              <Text style={styles.dashboardSubtext}>{((summary.totalInterestPaid / summary.totalPrincipalPaid) * 100).toFixed(1)}% of principal</Text>
            </View>
            <View style={styles.dashboardItem}>
              <Text style={styles.dashboardLabel}>Time to Pay Off</Text>
              <Text style={styles.dashboardValue}>{summary.yearsToPayoff.toFixed(1)} years</Text>
              <Text style={styles.dashboardSubtext}>{summary.monthsToPayoff} months</Text>
            </View>
            <View style={styles.dashboardItem}>
              <Text style={styles.dashboardLabel}>Debt Free Date</Text>
              <Text style={styles.dashboardValue}>{calculateDebtFreeDate(summary.monthsToPayoff)}</Text>
              <Text style={styles.dashboardSubtext}>Estimated payoff date</Text>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.subtitle}>Payment Schedule</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>Month</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>Beg Bal</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>Tot Paid</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>Principal</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>Interest</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>Remaining Balance</Text></View>
              </View>
              {paymentSchedule.map((item, index) => (
                <View style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff' }]} key={item.month}>
                  <View style={styles.tableCol}><Text style={styles.tableCell}>M{item.month}</Text></View>
                  <View style={styles.tableCol}><Text style={styles.tableCell}>{currencyFormatter.format(item.startingBalance)}</Text></View>
                  <View style={styles.tableCol}><Text style={styles.tableCell}>{currencyFormatter.format(item.totPaid)}</Text></View>
                  <View style={styles.tableCol}><Text style={styles.tableCell}>{currencyFormatter.format(item.principal)}</Text></View>
                  <View style={styles.tableCol}><Text style={styles.tableCell}>{currencyFormatter.format(item.interest)}</Text></View>
                  <View style={styles.tableCol}><Text style={styles.tableCell}>{currencyFormatter.format(item.balance)}</Text></View>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.subtitle}>10 Tips to Stay Debt-Free and Become Debt-Free Faster</Text>
            <Text style={styles.tipTitle}>1. Create and Stick to a Budget</Text>
            <Text style={styles.tipText}>Track your income and expenses, and allocate your money wisely to avoid overspending.</Text>

            <Text style={styles.tipTitle}>2. Build an Emergency Fund</Text>
            <Text style={styles.tipText}>Save 3-6 months of living expenses to avoid relying on credit cards for unexpected costs.</Text>

            <Text style={styles.tipTitle}>3. Pay More Than the Minimum</Text>
            <Text style={styles.tipText}>Always pay more than the minimum payment on your credit cards to reduce interest and pay off debt faster.</Text>

            <Text style={styles.tipTitle}>4. Use the Debt Avalanche Method</Text>
            <Text style={styles.tipText}>Focus on paying off the debt with the highest interest rate first while making minimum payments on others.</Text>

            <Text style={styles.tipTitle}>5. Consider Balance Transfer Options</Text>
            <Text style={styles.tipText}>Transfer high-interest debt to a card with a 0% introductory APR to save on interest charges.</Text>

            <Text style={styles.tipTitle}>6. Increase Your Income</Text>
            <Text style={styles.tipText}>Look for ways to earn extra money through side hustles or asking for a raise at work.</Text>

            <Text style={styles.tipTitle}>7. Cut Unnecessary Expenses</Text>
            <Text style={styles.tipText}>Identify and eliminate non-essential spending to free up more money for debt repayment.</Text>

            <Text style={styles.tipTitle}>8. Avoid New Debt</Text>
            <Text style={styles.tipText}>While paying off existing debt, avoid taking on new debt to prevent further financial strain.</Text>

            <Text style={styles.tipTitle}>9. Negotiate Lower Interest Rates</Text>
            <Text style={styles.tipText}>Contact your credit card companies and ask for lower interest rates to reduce your overall debt burden.</Text>

            <Text style={styles.tipTitle}>10. Educate Yourself on Personal Finance</Text>
            <Text style={styles.tipText}>Continuously learn about money management to make informed financial decisions and avoid future debt.</Text>
          </View>
        </Page>
      </Document>
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text>An error occurred while generating the PDF. Please try again.</Text>
          </View>
        </Page>
      </Document>
    );
  }
};

export default function Component() {
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [showChart, setShowChart] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [email, setEmail] = useState('')
  const { toast } = useToast()
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)
  const [originalTotalInterestPaid, setOriginalTotalInterestPaid] = useState<number | null>(null)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      principal: 1000,
      apr: 18,
      minimumPayment: 25,
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
      if (originalTotalInterestPaid === null) {
        setOriginalTotalInterestPaid(calculatedSummary.totalInterestPaid)
      }
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
      const requiredMinimumPayment = Math.max(interest + requiredPrincipal, values.minimumPayment)
      let payment = Math.max(values.minimumPayment, interest + requiredPrincipal) + values.additionalPayment
      payment = Math.min(payment, balance + interest)
      const principal = payment - interest
      balance -= principal
      const totPaid = payment
      totalInterestPaid += interest
      totalPrincipalPaid += principal

      const cumulativePrincipal = totalPrincipalPaid
      const cumulativeInterest = totalInterestPaid

      schedule.push({
        month,
        startingBalance: parseFloat(startingBalance.toFixed(2)),
        balance: parseFloat(balance.toFixed(2)),
        payment: parseFloat(payment.toFixed(2)),
        principal: parseFloat(principal.toFixed(2)),
        interest: parseFloat(interest.toFixed(2)),
        cumulativePrincipal: parseFloat(cumulativePrincipal.toFixed(2)),
        cumulativeInterest: parseFloat(cumulativeInterest.toFixed(2)),
        requiredMinimumPayment: parseFloat(requiredMinimumPayment.toFixed(2)),
        totPaid: parseFloat(totPaid.toFixed(2))
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
             Enter your card details below
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This calculator projects your payoff date and details and allows you to run simulations under various monthly payment scenarios.            
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
                        <InfoTooltip content="Enter an additional amount you could pay each month toward your principal balance." />
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
              <div className="flex items-center space-x-2">
                <Switch
                  id="advanced-options"
                  checked={showAdvancedOptions}
                  onCheckedChange={setShowAdvancedOptions}
                />
                <Label htmlFor="advanced-options">Advanced Options</Label>
              </div>
              {showAdvancedOptions && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minimumPayment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center group">
                        Alternative Minimum Payment ($)
                          <InfoTooltip content="Defined in the card agreement, this is lowest minimum payment the issuer accepts for cards with a balance. If your balance falls below this number the balance becomes the minimum payment. By default we have this set at $25" />
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
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {summary && (
        <div className="space-y-4">
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold">Payoff Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col space-y-1.5 p-6 bg-primary/10 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground flex items-center">
                    <DollarSignIcon className="mr-2 h-4 w-4" />
                    Total Paid
                  </span>
                  <span className="text-2xl font-bold">{currencyFormatter.format(summary.totalInterestPaid + summary.totalPrincipalPaid)}</span>
                  <span className="text-xs text-muted-foreground">Principal + Interest</span>
                </div>
                <div className="flex flex-col space-y-1.5 p-6 bg-destructive/10 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground flex items-center">
                    <ArrowUpIcon className="mr-2 h-4 w-4" />
                    Total Interest Paid
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
                      Reduce Payoff Time
                      <ArrowRightIcon className="inline-block ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                    <div className="p-4 bg-green-50 dark:bg-green-900 rounded-t-lg">
                      <h3 className="font-semibold text-lg mb-2 text-green-800 dark:text-green-100">Reduce Time to Payoff</h3>
                      <p className="text-sm text-green-700 dark:text-green-200">Enter an amount you can pay monthly in addition to the minimum amount due</p>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">$</span>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          className="w-32 border-gray-300 dark:border-gray-600"
                          min="0"
                          step="0.01"
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              form.setValue('additionalPayment', value);
                              form.trigger('additionalPayment');
                            }
                          }}
                        />
                        <Button 
                          onClick={() => setPopoverOpen(false)}
                          className="bg-green-600 text-white hover:bg-green-700 transition-colors"
                        >
                          Calculate Results
                        </Button>
                      </div>
                      {form.getValues('additionalPayment') > 0 && originalTotalInterestPaid !== null && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          With an extra ${form.getValues('additionalPayment')}/month, you could be debt-free by <span className="font-bold text-green-600 dark:text-green-400">{calculateDebtFreeDate(summary.monthsToPayoff)}</span>, 
                          saving <span className="font-bold text-green-600 dark:text-green-400">{currencyFormatter.format(originalTotalInterestPaid - summary.totalInterestPaid)}</span> in interest!
                        </p>
                      )}
                      <Separator className="my-4" />
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="outline" 
                  className="group text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 transition-colors"
                  onClick={() => {
                    toast({
                      title: "Report Sent",
                      description: "Your debt repayment report has been sent to your email.",
                    });
                  }}
                >
                  Email my report
                  <Send className="inline-block ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button 
                  variant="outline" 
                  className="group text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200 transition-colors"
                  onClick={() => {
                    setIsPdfGenerating(true);
                    setTimeout(() => {
                      const pdfBlob = pdf(<PDFReport summary={summary} paymentSchedule={paymentSchedule} />).toBlob();
                      pdfBlob.then((blob) => {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'credit-card-debt-report.pdf';
                        link.click();
                        URL.revokeObjectURL(url);
                        setIsPdfGenerating(false);
                      });
                    }, 100);
                  }}
                  disabled={isPdfGenerating}
                >
                  {isPdfGenerating ? 'Generating PDF...' : 'Download PDF Report'}
                  <FileDown className="inline-block ml-1 h-4 w-4 transition-transform group-hover:translate-y-1" />
                </Button>
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
              <p className="text-sm text-muted-foreground mt-2">
                {form.getValues('additionalPayment') > 0
                  ? `Assuming Minimum Payment Plus ${currencyFormatter.format(form.getValues('additionalPayment'))} Are Made Each Month`
                  : 'Assuming Only Minimum Payments Are Made Each Month'}
              </p>
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
                      <Tooltip 
                        formatter={(value, name) => [currencyFormatter.format(value), name]} 
                        labelFormatter={(label) => `Month ${label}`}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="principal" stroke="#10b981" name="Principal" />
                      <Line type="monotone" dataKey="interest" stroke="#ef4444" name="Interest" />
                      <Line type="monotone" dataKey="payment" stroke="#3b82f6" name="Total Payment" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 z-10 bg-background">
                        <tr className="bg-muted/50">
                          <th className="p-2 text-left font-semibold">Month</th>
                          <th className="p-2 text-right font-semibold">Beg Bal</th>
                          <th className="p-2 text-right font-semibold">Tot Paid</th>
                          <th className="p-2 text-right font-semibold">Principal</th>
                          <th className="p-2 text-right font-semibold">Interest</th>
                          <th className="p-2 text-right font-semibold">Remaining Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentSchedule.map((item, index) => (
                          <tr key={item.month} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                            <td className="p-2 text-left font-medium">M{item.month}</td>
                            <td className="p-2 text-right">{currencyFormatter.format(item.startingBalance)}</td>
                            <td className="p-2 text-right">{currencyFormatter.format(item.totPaid)}</td>
                            <td className="p-2 text-right">{currencyFormatter.format(item.principal)}</td>
                            <td className="p-2 text-right">{currencyFormatter.format(item.interest)}</td>
                            <td className="p-2 text-right">{currencyFormatter.format(item.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}