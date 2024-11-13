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

type UserInfo = z.infer<typeof userInfoSchema>
type DebtTypes = z.infer<typeof debtTypesSchema>
type DebtInfo = z.infer<typeof debtFormSchema>
type FullDebtInfo = DebtInfo & { type: string }

export function MultiStepForm() {
  const [step, setStep] = useState<'userInfo' | 'debtTypes' | 'debtInfo' | 'summary'>('userInfo')
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [selectedDebtTypes, setSelectedDebtTypes] = useState<string[]>([])
  const [currentDebtType, setCurrentDebtType] = useState<string | null>(null)
  const [allDebts, setAllDebts] = useState<FullDebtInfo[]>([])

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

    // If it's a credit card, allow adding more
    if (currentDebtType === 'creditCard') {
      debtInfoForm.reset()
    } else {
      // Move to the next debt type or summary
      const currentIndex = selectedDebtTypes.indexOf(currentDebtType)
      if (currentIndex < selectedDebtTypes.length - 1) {
        setCurrentDebtType(selectedDebtTypes[currentIndex + 1])
        debtInfoForm.reset()
      } else {
        setStep('summary')
      }
    }
  }

  function addAnotherCreditCard() {
    debtInfoForm.reset()
  }

  function moveToNextDebtType() {
    const currentIndex = selectedDebtTypes.indexOf(currentDebtType!)
    if (currentIndex < selectedDebtTypes.length - 1) {
      setCurrentDebtType(selectedDebtTypes[currentIndex + 1])
      debtInfoForm.reset()
    } else {
      setStep('summary')
    }
  }

  const getProgressPercentage = () => {
    const steps = ['userInfo', 'debtTypes', 'debtInfo', 'summary']
    const currentIndex = steps.indexOf(step)
    return Math.round((currentIndex / (steps.length - 1)) * 100)
  }

  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        <Card className="w-full shadow-lg">
          <CardHeader className="bg-blue-500 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-center">
              {step === 'userInfo' ? 'User Information' : 
               step === 'debtTypes' ? 'Types of Unsecured Debt' :
               step === 'debtInfo' ? `${currentDebtType === 'creditCard' ? 'Credit Card' : currentDebtType === 'personalLoan' ? 'Personal Loan' : currentDebtType} Information` : 
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
                  <FormField
                    control={debtTypesForm.control}
                    name="creditCard"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Credit Card</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={debtTypesForm.control}
                    name="personalLoan"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Personal Loan</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={debtTypesForm.control}
                    name="medicalBill"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Medical Bill</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={debtTypesForm.control}
                    name="studentLoan"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Student Loan</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={debtTypesForm.control}
                    name="other"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Other Unsecured Debt</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
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
                      {currentDebtType === 'creditCard' ? 'Add Credit Card' : 'Submit'}
                    </Button>
                    {currentDebtType === 'creditCard' && (
                      <Button type="button" onClick={moveToNextDebtType} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white">
                        Next Debt Type
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            )}
            {step === 'summary' && userInfo && (
              <div className="space-y-6">
                <Table>
                  <TableCaption>Submitted Debt Information</TableCaption>
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
                            {debt.type === 'creditCard' ? 'Credit Card' : 
                             debt.type === 'personalLoan' ? 'Personal Loan' : 
                             debt.type === 'medicalBill' ? 'Medical Bill' : 
                             debt.type === 'studentLoan' ? 'Student Loan' : 'Other'} {index + 1}
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
                  </TableBody>
                </Table>
                <Button onClick={() => setStep('debtTypes')} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Add More Debts
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}