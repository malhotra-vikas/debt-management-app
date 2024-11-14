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
import { Slider } from '@/components/ui/slider'
import { toast } from '@/components/ui/use-toast'
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
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { HorizontalHeader } from './horizontal-header'
import { VerticalHeader } from './vertical-header'
import { HomeIcon, CreditCardIcon, PieChartIcon, SettingsIcon, HelpCircleIcon, MoonIcon, SunIcon } from 'lucide-react'

const userInfoSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
  phoneNumber: z.string().regex(/^\d{10}$/, { message: "Phone number must be 10 digits" }),
})

const debtTypesSchema = z.object({
  creditCard: z.boolean().default(false),
  personalLoan: z.boolean().default(false),
  medicalBill: z.boolean().default(false),
  studentLoan: z.boolean().default(false),
  other: z.boolean().default(false),
})

const debtFormSchema = z.object({
  creditorName: z.string().min(2, {
    message: "Creditor name must be at least 2 characters.",
  }),
  balance: z.number().min(0).max(1000000),
  interestRate: z.number().min(0).max(100),
})

const additionalInfoSchema = z.object({
  shortTermLoss: z.boolean(),
  futureIncomeIncrease: z.boolean(),
  futureIncomeAmount: z.number().optional(),
  debtSituation: z.enum(['overwhelmed', 'struggling', 'managing', 'improving']),
  monthlyMinimumPayments: z.number().min(0),
  hasSavings: z.boolean(),
  savingsAmount: z.number().optional(),
  yearsToDebtFree: z.number().min(1).max(30),
})

type UserInfo = z.infer<typeof userInfoSchema>
type DebtTypes = z.infer<typeof debtTypesSchema>
type DebtInfo = z.infer<typeof debtFormSchema>
type AdditionalInfo = z.infer<typeof additionalInfoSchema>
type FullDebtInfo = DebtInfo & { type: string }

export function MultiStepForm() {
  const [step, setStep] = useState<'userInfo' | 'debtTypes' | 'debtInfo' | 'additionalInfo' | 'summary'>('userInfo')
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [selectedDebtTypes, setSelectedDebtTypes] = useState<string[]>([])
  const [currentDebtType, setCurrentDebtType] = useState<string | null>(null)
  const [allDebts, setAllDebts] = useState<FullDebtInfo[]>([])
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const userInfoForm = useForm<UserInfo>({
    resolver: zodResolver(userInfoSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
    },
  })

  const debtTypesForm = useForm<DebtTypes>({
    resolver: zodResolver(debtTypesSchema),
    defaultValues: {
      creditCard: false,
      personalLoan: false,
      medicalBill: false,
      studentLoan: false,
      other: false,
    },
  })

  const debtInfoForm = useForm<DebtInfo>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: {
      creditorName: "",
      balance: 0,
      interestRate: 0,
    },
  })

  const additionalInfoForm = useForm<AdditionalInfo>({
    resolver: zodResolver(additionalInfoSchema),
    defaultValues: {
      shortTermLoss: false,
      futureIncomeIncrease: false,
      debtSituation: 'managing',
      monthlyMinimumPayments: 0,
      hasSavings: false,
      yearsToDebtFree: 5,
    },
  })

  function onUserInfoSubmit(values: UserInfo) {
    setUserInfo(values)
    setStep('debtTypes')
  }

  function onDebtTypesSubmit(values: DebtTypes) {
    const selected = Object.entries(values)
      .filter(([_, value]) => value)
      .map(([key, _]) => key)
    setSelectedDebtTypes(selected)
    if (selected.length > 0) {
      setCurrentDebtType(selected[0])
      setStep('debtInfo')
    } else {
      toast({
        title: "No debt types selected",
        description: "Please select at least one type of debt.",
        variant: "destructive",
      })
    }
  }

  function onDebtInfoSubmit(values: DebtInfo) {
    if (currentDebtType) {
      const fullDebtInfo: FullDebtInfo = { ...values, type: currentDebtType }
      setAllDebts([...allDebts, fullDebtInfo])
    }

    toast({
      title: "Debt information submitted",
      description: "Your debt information has been saved successfully.",
    })

    debtInfoForm.reset()
  }

  function onAdditionalInfoSubmit(values: AdditionalInfo) {
    setAdditionalInfo(values)
    setStep('summary')
  }

  function moveToNextDebtType() {
    const currentIndex = selectedDebtTypes.indexOf(currentDebtType!)
    if (currentIndex < selectedDebtTypes.length - 1) {
      setCurrentDebtType(selectedDebtTypes[currentIndex + 1])
      debtInfoForm.reset()
    } else {
      setStep('additionalInfo')
    }
  }

  const getProgressPercentage = () => {
    const steps = ['userInfo', 'debtTypes', 'debtInfo', 'additionalInfo', 'summary']
    const currentIndex = steps.indexOf(step)
    return Math.round((currentIndex / (steps.length - 1)) * 100)
  }

  const getDebtTypeLabel = (type: string) => {
    switch (type) {
      case 'creditCard': return 'Credit Card'
      case 'personalLoan': return 'Personal Loan'
      case 'medicalBill': return 'Medical Bill'
      case 'studentLoan': return 'Student Loan'
      case 'other': return 'Other Unsecured Debt'
      default: return type
    }
  }

  async function submitFormData() {
    if (!userInfo || !additionalInfo) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInfo,
          allDebts,
          additionalInfo,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit form data')
      }

      toast({
        title: "Form submitted successfully",
        description: "Your debt management information has been saved.",
      })
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: "Error submitting form",
        description: "There was a problem saving your information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HorizontalHeader />
      <div className="flex flex-1">
        <VerticalHeader />
        <main className="flex-1 bg-blue-100 p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <Card className="w-full shadow-lg">
              <CardHeader className="bg-blue-500 text-white rounded-t-lg">
                <CardTitle className="text-2xl font-bold text-center">
                  {step === 'userInfo' ? 'Tell us about you' : 
                   step === 'debtTypes' ? 'Which of these Unsecured Debt do you carry?' :
                   step === 'debtInfo' ? `${getDebtTypeLabel(currentDebtType!)} Information` : 
                   step === 'additionalInfo' ? 'Additional Information' :
                   'Summary'}
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-white rounded-b-lg">
                <div className="mb-6">
                  <Progress value={getProgressPercentage()} className="w-full h-2 mt-4" />
                </div>
                {step === 'userInfo' && (
                  <Form {...userInfoForm}>
                    <form onSubmit={userInfoForm.handleSubmit(onUserInfoSubmit)} className="space-y-6">
                      <FormField
                        control={userInfoForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-600 font-semibold">Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email" {...field} className="border-blue-300 focus:border-blue-500" />
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                      <div className="flex space-x-4">
                        <FormField
                          control={userInfoForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-blue-600 font-semibold">First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your first name" {...field} className="border-blue-300 focus:border-blue-500" />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userInfoForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-blue-600 font-semibold">Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your last name" {...field} className="border-blue-300 focus:border-blue-500" />
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={userInfoForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-600 font-semibold">Phone Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your 10-digit phone number" 
                                {...field} 
                                className="border-blue-300 focus:border-blue-500"
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]{10}"
                              />
                            </FormControl>
                            <FormDescription className="text-gray-500">
                              Please enter a 10-digit phone number without spaces or dashes.
                            </FormDescription>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">Next</Button>
                    </form>
                  </Form>
                )}
                {step === 'debtTypes' && (
                  <Form {...debtTypesForm}>
                    <form onSubmit={debtTypesForm.handleSubmit(onDebtTypesSubmit)} className="space-y-6">
                      {Object.keys(debtTypesSchema.shape).map((debtType) => (
                        <FormField
                          key={debtType}
                          control={debtTypesForm.control}
                          name={debtType as keyof DebtTypes}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>{getDebtTypeLabel(debtType)}</FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                      <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">Next</Button>
                    </form>
                  </Form>
                )}
                {step === 'debtInfo' && (
                  <Form {...debtInfoForm}>
                    <form onSubmit={debtInfoForm.handleSubmit(onDebtInfoSubmit)} className="space-y-6">
                      <FormField
                        control={debtInfoForm.control}
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
                        control={debtInfoForm.control}
                name="balance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-600 font-semibold">Current Balance ($)</FormLabel>
                            <FormControl>
                              <div className="space-y-3">
                                <Slider
                                  min={0}
                                  max={1000000}
                                  step={100}
                                  value={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                  className="w-full"
                                />
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">$0</span>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={1000000}
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                    className="w-24 text-center border-blue-300 focus:border-blue-500"
                                  />
                                  <span className="text-sm text-gray-500">$1,000,000</span>
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription className="text-gray-500">
                              The current amount you owe on this debt.
                            </FormDescription>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={debtInfoForm.control}
                        name="interestRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-600 font-semibold">Interest Rate (%)</FormLabel>
                            <FormControl>
                              <div className="space-y-3">
                                <Slider
                                  min={0}
                                  max={100}
                                  step={0.1}
                                  value={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                  className="w-full"
                                />
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">0%</span>
                                  <span className="text-lg font-semibold text-blue-600">{field.value.toFixed(1)}%</span>
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
                      <div className="flex space-x-4">
                        <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                          Add {getDebtTypeLabel(currentDebtType!)}
                        </Button>
                        <Button type="button" onClick={moveToNextDebtType} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white">
                          Next
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
                {step === 'additionalInfo' && (
                  <Form {...additionalInfoForm}>
                    <form onSubmit={additionalInfoForm.handleSubmit(onAdditionalInfoSubmit)} className="space-y-6">
                      <FormField
                        control={additionalInfoForm.control}
                        name="shortTermLoss"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Are you experiencing short-term loss in income?</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={additionalInfoForm.control}
                        name="futureIncomeIncrease"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked)
                                  if (!checked) {
                                    additionalInfoForm.setValue('futureIncomeAmount', undefined)
                                  }
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Will your income be increasing in the near future?</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      {additionalInfoForm.watch('futureIncomeIncrease') && (
                        <FormField
                          control={additionalInfoForm.control}
                          name="futureIncomeAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>How much will your income increase?</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter amount"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={additionalInfoForm.control}
                        name="debtSituation"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Which best describes your situation?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="overwhelmed" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Overwhelmed by debt
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="struggling" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Struggling to make payments
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="managing" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Managing, but want to improve
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="improving" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Actively improving financial situation
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={additionalInfoForm.control}
                        name="monthlyMinimumPayments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What is your total monthly minimum payments amount? ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter amount"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={additionalInfoForm.control}
                        name="hasSavings"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked)
                                  if (!checked) {
                                    additionalInfoForm.setValue('savingsAmount', undefined)
                                  }
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Do you have any savings?</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      {additionalInfoForm.watch('hasSavings') && (
                        <FormField
                          control={additionalInfoForm.control}
                          name="savingsAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>How much savings do you have? ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter amount"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={additionalInfoForm.control}
                        name="yearsToDebtFree"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>In how many years would you like to be debt free?</FormLabel>
                            <FormControl>
                              <div className="space-y-3">
                                <Slider
                                  min={1}
                                  max={30}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                  className="w-full"
                                />
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">1 year</span>
                                  <span className="text-lg font-semibold text-blue-600">{field.value} years</span>
                                  <span className="text-sm text-gray-500">30 years</span>
                                </div>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">Submit</Button>
                    </form>
                  </Form>
                )}
                {step === 'summary' && userInfo && additionalInfo && (
                  <div className="space-y-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Field</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Name</TableCell>
                          <TableCell>{`${userInfo.firstName} ${userInfo.lastName}`}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Email</TableCell>
                          <TableCell>{userInfo.email}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Phone Number</TableCell>
                          <TableCell>{userInfo.phoneNumber}</TableCell>
                        </TableRow>
                        {allDebts.map((debt, index) => (
                          <React.Fragment key={index}>
                            <TableRow>
                              <TableCell className="font-medium" colSpan={2}>
                                {getDebtTypeLabel(debt.type)} {index + 1}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Creditor Name</TableCell>
                              <TableCell>{debt.creditorName}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Balance</TableCell>
                              <TableCell>${debt.balance.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Interest Rate</TableCell>
                              <TableCell>{debt.interestRate.toFixed(1)}%</TableCell>
                            </TableRow>
                          </React.Fragment>
                        ))}
                        <TableRow>
                          <TableCell className="font-medium">Experiencing Short-Term Income Loss</TableCell>
                          <TableCell>{additionalInfo.shortTermLoss ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Future Income Increase</TableCell>
                          <TableCell>{additionalInfo.futureIncomeIncrease ? `Yes, $${additionalInfo.futureIncomeAmount}` : 'No'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Debt Situation</TableCell>
                          <TableCell>{additionalInfo.debtSituation}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Monthly Minimum Payments</TableCell>
                          <TableCell>${additionalInfo.monthlyMinimumPayments.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Savings</TableCell>
                          <TableCell>{additionalInfo.hasSavings ? `$${additionalInfo.savingsAmount}` : 'No savings'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Years to Become Debt Free</TableCell>
                          <TableCell>{additionalInfo.yearsToDebtFree} years</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    <Button 
                      onClick={submitFormData} 
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Looks good'}
                    </Button>
                    <Button onClick={() => setStep('debtTypes')} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                      Start Over
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}