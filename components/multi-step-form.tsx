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

const userInfoSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }),
})

const debtFormSchema = z.object({
  creditorName: z.string().min(2, {
    message: "Creditor name must be at least 2 characters.",
  }),
  debtType: z.enum(["credit_card", "personal_loan", "line_of_credit", "other"]),
  balance: z.number().min(0).max(100000),
  interestRate: z.number().min(0).max(100),
})

type UserInfo = z.infer<typeof userInfoSchema>
type DebtInfo = z.infer<typeof debtFormSchema>
type FullDebtInfo = UserInfo & DebtInfo

export function MultiStepForm() {
  const [step, setStep] = useState<'userInfo' | 'debtInfo1' | 'debtInfo2' | 'debtInfo3' | 'debtInfo4' | 'summary'>('userInfo')
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [allDebts, setAllDebts] = useState<FullDebtInfo[]>([])

  const userInfoForm = useForm<UserInfo>({
    resolver: zodResolver(userInfoSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
    },
  })

  const debtInfoForm = useForm<DebtInfo>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: {
      creditorName: "",
      debtType: "credit_card",
      balance: 0,
      interestRate: 0,
    },
  })

  function onUserInfoSubmit(values: UserInfo) {
    setUserInfo(values)
    setStep('debtInfo1')
  }

  function onDebtInfoSubmit(values: DebtInfo) {
    if (userInfo) {
      const fullDebtInfo: FullDebtInfo = { ...userInfo, ...values }
      setAllDebts([...allDebts, fullDebtInfo])
    }
    console.log({ ...userInfo, ...values })
    toast({
      title: "Information submitted",
      description: "Your information has been saved successfully.",
    })
    setStep('summary')
  }

  function resetForms() {
    debtInfoForm.reset()
    setStep('debtInfo1')
  }

  const renderDebtInfoStep = (currentStep: 'debtInfo1' | 'debtInfo2' | 'debtInfo3' | 'debtInfo4') => {
    const stepContent = {
      debtInfo1: (
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
      ),
      debtInfo2: (
        <FormField
          control={debtInfoForm.control}
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
      ),
      debtInfo3: (
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
                    max={100000}
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
                      max={100000}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-24 text-center border-blue-300 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500">$100,000</span>
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
      ),
      debtInfo4: (
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
      ),
    }

    return (
      <Form {...debtInfoForm}>
        <form onSubmit={debtInfoForm.handleSubmit(currentStep === 'debtInfo4' ? onDebtInfoSubmit : () => setStep(getNextStep(currentStep)))} className="space-y-6">
          {stepContent[currentStep]}
          <div className="flex space-x-4">
            <Button type="button" onClick={() => setStep(getPreviousStep(currentStep))} className="w-1/2 bg-gray-300 hover:bg-gray-400 text-gray-800">Back</Button>
            <Button type="submit" className="w-1/2 bg-blue-500 hover:bg-blue-600 text-white">{currentStep === 'debtInfo4' ? 'Submit' : 'Next'}</Button>
          </div>
        </form>
      </Form>
    )
  }

  const getNextStep = (currentStep: string) => {
    const steps = ['userInfo', 'debtInfo1', 'debtInfo2', 'debtInfo3', 'debtInfo4', 'summary']
    const currentIndex = steps.indexOf(currentStep)
    return steps[currentIndex + 1] as typeof step
  }

  const getPreviousStep = (currentStep: string) => {
    const steps = ['userInfo', 'debtInfo1', 'debtInfo2', 'debtInfo3', 'debtInfo4', 'summary']
    const currentIndex = steps.indexOf(currentStep)
    return steps[currentIndex - 1] as typeof step
  }

  const getProgressPercentage = () => {
    const steps = ['userInfo', 'debtInfo1', 'debtInfo2', 'debtInfo3', 'debtInfo4', 'summary']
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
               step.startsWith('debtInfo') ? `Debt Information (Step ${step.slice(-1)} of 4)` : 
               'Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white rounded-b-lg">
            <div className="mb-6">
              <Progress value={getProgressPercentage()} className="w-full h-2" />
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
                  <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white">Next</Button>
                </form>
              </Form>
            )}
            {(step === 'debtInfo1' || step === 'debtInfo2' || step === 'debtInfo3' || step === 'debtInfo4') && renderDebtInfoStep(step)}
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
                    {allDebts.length > 0 && (
                      <>
                        <TableRow>
                          <TableCell className="font-medium">Creditor Name</TableCell>
                          <TableCell>{allDebts[allDebts.length - 1].creditorName}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Debt Type</TableCell>
                          <TableCell>{allDebts[allDebts.length - 1].debtType}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Balance</TableCell>
                          <TableCell>${allDebts[allDebts.length - 1].balance.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Interest Rate</TableCell>
                          <TableCell>{allDebts[allDebts.length - 1].interestRate.toFixed(1)}%</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
                <Button onClick={resetForms} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Add Another Debt
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        {step.startsWith('debtInfo') && (
          <Card className="w-full shadow-lg">
            <CardHeader className="bg-blue-500 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold text-center">All Debts</CardTitle>
            </CardHeader>
            <CardContent className="bg-white rounded-b-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Creditor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Interest Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allDebts.map((debt, index) => (
                    <TableRow key={index}>
                      <TableCell>{`${debt.firstName} ${debt.lastName}`}</TableCell>
                      <TableCell>{debt.creditorName}</TableCell>
                      <TableCell>{debt.debtType}</TableCell>
                      <TableCell>${debt.balance.toFixed(2)}</TableCell>
                      <TableCell>{debt.interestRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}