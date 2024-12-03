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
import { Document, Page, Text, View, StyleSheet, Svg, Path, Rect } from '@react-pdf/renderer'
import { pdf } from '@react-pdf/renderer'

// Import the CSS file
import '@/styles/credit-card-calculator.css'

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
  originalTotalInterestPaid: number
  apr: number
  monthlyPayment: number
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
    fontFamily: 'Helvetica',
    color: '#333333'
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#002A65',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#002A65',
    fontWeight: 'bold',
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
  summaryTableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#72A967',
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
    fontWeight: 'bold',
  },
  tableCell: {
    margin: 'auto',
    marginTop: 5,
    marginBottom: 5,
    fontSize: 10,
  },
  scenarioTitle: {
    fontSize: 14,
    marginTop: 15,
    marginBottom: 5,
    color: '#002A65',
    fontWeight: 'bold',
  },
  debtFreeDate: {
    fontWeight: 'bold',
    color: '#4CAF50', 
  },
  savings: {
    fontWeight: 'bold',
    color: '#4CAF50', 
  },
  chartContainer: {
    marginTop: 20,
    marginBottom: 20,
    height: 200,
    width: 400,
    alignSelf: 'center',
  },
  pieChart: {
    width: 200,
    height: 200,
    alignSelf: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  legendColor: {
    width: 12,
    height: 12,
    marginRight: 5,
  },
  legendText: {
    fontSize: 10,
  },
  chart: {
    width: '48%',
    height: 200,
  },
  chartsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  barChart: {
    width: '100%',
    height: 200,
    marginTop: 20,
    marginBottom: 20,
  },
  barChartLabel: {
    fontSize: 8,
    textAnchor: 'middle',
    alignItems: 'center',
  },  
})

function printStuff(formValues, summary) {
  console.log("Form Values are ", formValues)
  console.log("Summary Values are ", summary)
}

function calculateNewPayoffTimeForPDF(principal: number, apr: number, monthlyPayment: number, additionalPayment: number): number {
  let balance = principal;
  const monthlyRate = apr / 12 / 100;
  let months = 0;

  while (balance > 0 && months < 600) {
    months++;
    const interest = balance * monthlyRate;
    const totalPayment = Math.min(monthlyPayment + additionalPayment, balance + interest);
    balance = balance - (totalPayment - interest);
  }

  return months;
}

function calculateInterestSavedForPDF(principal: number, apr: number, monthlyPayment: number, originalMonths: number, newMonths: number): number {
  const monthlyRate = apr / 12 / 100;
  let originalInterest = 0;
  let newInterest = 0;
  let originalBalance = principal;
  let newBalance = principal;

  for (let i = 1; i <= Math.max(originalMonths, newMonths); i++) {
    if (i <= originalMonths) {
      const interest = originalBalance * monthlyRate;
      originalInterest += interest;
      originalBalance = Math.max(0, originalBalance - (monthlyPayment - interest));
    }
    if (i <= newMonths) {
      const interest = newBalance * monthlyRate;
      newInterest += interest;
      newBalance = Math.max(0, newBalance - (monthlyPayment - interest));
    }
  }

  return originalInterest - newInterest;
}

const PDFReport = ({ summary, paymentSchedule, formValues }: { summary: Summary, paymentSchedule: PaymentScheduleItem[], formValues: FormValues }) => {
  const scenarios = [10, 25, 50];

  const totalAmount = summary.totalPrincipalPaid + summary.totalInterestPaid;
  const principalPercentage = (summary.totalPrincipalPaid / totalAmount) * 100;
  const interestPercentage = (summary.totalInterestPaid / totalAmount) * 100;

  // Function to calculate pie chart path
  const calculatePieChartPath = (startAngle: number, endAngle: number) => {
    const centerX = 50;
    const centerY = 50;
    const radius = 40;

    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

    return `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
  };

  // Calculate paths for pie chart
  const principalPath = calculatePieChartPath(0, (principalPercentage / 100) * 2 * Math.PI);
  const interestPath = calculatePieChartPath((principalPercentage / 100) * 2 * Math.PI, 2 * Math.PI);

  // Prepare data for bar chart
  const barChartData = [
    { label: 'Principal', value: summary.totalPrincipalPaid },
    { label: 'Interest', value: summary.totalInterestPaid },
  ];
  const maxValue = Math.max(...barChartData.map(item => item.value));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Credit Card Payoff Report</Text>
          <Text style={styles.subtitle}>Payoff Details</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.summaryTableCol}><Text style={styles.tableCell}>Total Paid</Text></View>
              <View style={styles.summaryTableCol}><Text style={styles.tableCell}>Total Interest</Text></View>
              <View style={styles.summaryTableCol}><Text style={styles.tableCell}>Total Principal</Text></View>
              <View style={styles.summaryTableCol}><Text style={styles.tableCell}>Time to Pay Off</Text></View>
              <View style={styles.summaryTableCol}><Text style={styles.tableCell}>Debt Free Date</Text></View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.summaryTableCol}><Text style={styles.tableCell}>{currencyFormatter.format(summary.totalInterestPaid + summary.totalPrincipalPaid)}</Text></View>
              <View style={styles.summaryTableCol}><Text style={styles.tableCell}>{currencyFormatter.format(summary.totalInterestPaid)}</Text></View>
              <View style={styles.summaryTableCol}><Text style={styles.tableCell}>{currencyFormatter.format(summary.totalPrincipalPaid)}</Text></View>
              <View style={styles.summaryTableCol}><Text style={styles.tableCell}>{summary.yearsToPayoff.toFixed(1)} years ({summary.monthsToPayoff} months)</Text></View>
              <View style={styles.summaryTableCol}><Text style={styles.tableCell}>{calculateDebtFreeDate(summary.monthsToPayoff)}</Text></View>
            </View>
          </View>
          <View style={styles.chartsContainer}>
            {/* Pie Chart */}
            <View style={styles.chart}>
              <Svg height={100} width={100}>
                <Path d={principalPath} fill="#4CAF50" />
                <Path d={interestPath} fill="#FF5722" />
              </Svg>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.legendText}>Principal: {principalPercentage.toFixed(1)}%</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#FF5722' }]} />
                  <Text style={styles.legendText}>Interest: {interestPercentage.toFixed(1)}%</Text>
                </View>
              </View>
            </View>
            
            {/* Bar Chart */}
            <View style={styles.chart}>
              <Svg height={200} width="100%">
                {barChartData.map((item, index) => {
                  const barHeight = (item.value / maxValue) * 150;
                  const barY = 200 - barHeight;
                  return (
                    <React.Fragment key={item.label}>
                      <Rect
                        x={index * 60 + 10}
                        y={barY}
                        width={40}
                        height={barHeight}
                        fill={item.label === 'Principal' ? '#4CAF50' : '#FF5722'}
                      />
                      <Text
                        x={index * 60 + 30}
                        y={190}
                        style={styles.barChartLabel}
                      >
                        {item.label}
                      </Text>
                      <Text
                        x={index * 60 + 30}
                        y={barY - 10}
                        style={styles.barChartLabel}
                      >
                        {currencyFormatter.format(item.value)}
                      </Text>
                    </React.Fragment>
                  );
                })}
              </Svg>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.subtitle}>Additional Payment Scenarios</Text>
          {scenarios.map((additionalPayment) => {
            const requiredMinimumPayment = Math.max(formValues.apr/12 + formValues.principal, formValues.minimumPayment)

            printStuff(formValues, summary)

            console.log("requiredMinimumPayment ", requiredMinimumPayment)
            const newMonths = calculateNewPayoffTimeForPDF(formValues.principal, formValues.apr, requiredMinimumPayment, additionalPayment);
            console.log("newMonths ", newMonths)

            const interestSaved = calculateInterestSavedForPDF(formValues.principal, formValues.apr, requiredMinimumPayment, summary.monthsToPayoff, newMonths);
            console.log("interestSaved ", interestSaved)

            return (              
              <View key={additionalPayment}>
                <Text style={styles.scenarioTitle}>
                  With an extra ${additionalPayment}/month, you could be debt-free by {' '}
                  <Text style={styles.debtFreeDate}>
                    {calculateDebtFreeDate(newMonths)}
                  </Text>, 
                  saving {' '}
                  <Text style={styles.savings}>
                    {currencyFormatter.format(interestSaved)}
                  </Text> in interest!
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.section}>
          <Text style={styles.subtitle}>Payment Schedule</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Month</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Beginning Balance</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Total Paid</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Principal</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Interest</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Remaining Balance</Text></View>
            </View>
            {paymentSchedule.map((item, index) => (
              <View style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#f9fafb' : '#ffffff' }]} key={item.month}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{item.month}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{currencyFormatter.format(item.startingBalance)}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{currencyFormatter.format(item.totPaid)}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{currencyFormatter.format(item.principal)}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{currencyFormatter.format(item.interest)}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{currencyFormatter.format(item.balance)}</Text></View>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
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
    let monthlyPayment = 0;

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
      monthlyPayment = payment;

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
      originalTotalInterestPaid: originalTotalInterestPaid ? originalTotalInterestPaid : 0,
      apr: values.apr,
      monthlyPayment: monthlyPayment
    }

    return [schedule, summary]
  }

  return (
    <div className="card-calculator-container">
      <Card className="card-calculator-card">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="card-calculator-title">
            <CreditCard className="mr-2 h-6 w-6" />
             Enter your card details below
          </CardTitle>
          <p className="card-calculator-description">
            This calculator projects your payoff date and details and allows you to run simulations under various monthly payment scenarios.            
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="card-calculator-form">
              <div className="card-calculator-grid space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
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
                        <Input type="number" step="10" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                        <Input type="number" step="1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="additionalPayment"
                  render={({ field }) => (
                    <FormItem hidden>
                      <FormLabel className="flex items-center group">
                        Additional Monthly Payment ($)
                        <InfoTooltip content="Enter an additional amount you could pay each month toward your principal balance." />
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="card-calculator-advanced-options mt-4">
                <Switch
                  id="advanced-options"
                  checked={showAdvancedOptions}
                  onCheckedChange={setShowAdvancedOptions}
                />
                <Label htmlFor="advanced-options">Advanced Options</Label>
              </div>
              {showAdvancedOptions && (
                <div className="card-calculator-grid space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
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
                          <Input type="number" step="1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                          <Input type="number" step="10" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
        <div className="card-calculator-payoff-details">
          <Card className="card-calculator-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold">Payoff Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="card-calculator-summary-grid">
                <div className="card-calculator-summary-item bg-primary/10">
                  <span className="card-calculator-summary-label">
                    <DollarSignIcon className="mr-2 h-4 w-4" />
                    Total Paid
                  </span>
                  <span className="card-calculator-summary-value">{currencyFormatter.format(summary.totalInterestPaid + summary.totalPrincipalPaid)}</span>
                  <span className="card-calculator-summary-subtext">Principal + Interest</span>
                </div>
                <div className="card-calculator-summary-item bg-destructive/10">
                  <span className="card-calculator-summary-label">
                    <ArrowUpIcon className="mr-2 h-4 w-4" />
                    Total Interest Paid
                  </span>
                  <span className="card-calculator-summary-value">{currencyFormatter.format(summary.totalInterestPaid)}</span>
                  <span className="card-calculator-summary-subtext">{((summary.totalInterestPaid / summary.totalPrincipalPaid) * 100).toFixed(1)}% of principal</span>
                </div>
                <div className="card-calculator-summary-item bg-primary/10">
                  <span className="card-calculator-summary-label">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Time to Pay Off
                  </span>
                  <span className="card-calculator-summary-value">{summary.yearsToPayoff.toFixed(1)} years</span>
                  <span className="card-calculator-summary-subtext">{summary.monthsToPayoff} months</span>
                </div>
                <div className="card-calculator-summary-item bg-green-100 dark:bg-green-900">
                  <span className="card-calculator-summary-label">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Debt Free Date
                  </span>
                  <span className="card-calculator-summary-value">{calculateDebtFreeDate(summary.monthsToPayoff)}</span>
                  <span className="card-calculator-summary-subtext">Estimated payoff date</span>
                </div>
              </div>
              <div className="card-calculator-actions">
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="group text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 border-[hsl(var(--custom-border))] transition-colors"
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
                      {form.getValues('additionalPayment') > 0 && originalTotalInterestPaid !== null && (originalTotalInterestPaid - summary.totalInterestPaid) > 0 && (
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
                  className="group text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 border-[hsl(var(--custom-border))] transition-colors"
                  
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
                {
                <Button 
                  variant="outline" 
                  className="group hover:text-[hsl(var(--custom-text))] border-[hsl(var(--custom-border))] transition-colors"
                  onClick={() => {
                    setIsPdfGenerating(true);
                    setTimeout(() => {
                      const pdfBlob = pdf(<PDFReport summary={summary} paymentSchedule={paymentSchedule} formValues={form.getValues()}/>).toBlob();
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
                }
              </div>
            </CardContent>
          </Card>

          <Card className="card-calculator-card">
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
              <p className="card-calculator-description mt-2">
                {form.getValues('additionalPayment') > 0
                  ? `Assuming Minimum Payment Plus ${currencyFormatter.format(form.getValues('additionalPayment'))} Are Made Each Month`
                  : 'Assuming Only Minimum Payments Are Made Each Month'}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {showChart ? (
                <div className="card-calculator-chart h-[400px] w-full">
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
                <div className="card-calculator-table-container overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="card-calculator-table-wrapper max-h-[400px] overflow-y-auto">
                    <table className="card-calculator-table w-full border-collapse bg-white dark:bg-gray-800">
                      <thead className="card-calculator-table-header sticky top-0 z-10 bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="card-calculator-table-header-cell p-3 text-sm text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Month</th>
                          <th className="card-calculator-table-header-cell p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Beg Bal</th>
                          <th className="card-calculator-table-header-cell p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tot Paid</th>
                          <th className="card-calculator-table-header-cell p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Principal</th>
                          <th className="card-calculator-table-header-cell p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Interest</th>
                          <th className="card-calculator-table-header-cell p-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Remaining Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentSchedule.map((item) => (
                          <tr key={item.month} className="card-calculator-table-row" title={`Month: ${item.month}, Total Paid: ${currencyFormatter.format(item.totPaid)}, Req Minimum: ${currencyFormatter.format(item.requiredMinimumPayment)}, Add'l Principal: ${currencyFormatter.format(form.getValues('additionalPayment'))}`}>
                            <td className="card-calculator-table-cell p-3 text-sm">Month {item.month}</td>
                            <td className="card-calculator-table-cell p-3 text-sm text-left">{currencyFormatter.format(item.startingBalance)}</td>
                            <td className="card-calculator-table-cell p-3 text-sm text-left">{currencyFormatter.format(item.totPaid)}</td>
                            <td className="card-calculator-table-cell p-3 text-sm text-left">{currencyFormatter.format(item.principal)}</td>
                            <td className="card-calculator-table-cell p-3 text-sm text-left">{currencyFormatter.format(item.interest)}</td>
                            <td className="card-calculator-table-cell p-3 text-sm text-left">{currencyFormatter.format(item.balance)}</td>
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