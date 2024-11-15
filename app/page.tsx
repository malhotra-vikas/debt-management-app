import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Debt Management Tools</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Debt Information Form</CardTitle>
              <CardDescription>Fill out your debt information to get personalized advice</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/debt-information-form">Go to Debt Information Form</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Credit Card Debt Calculator</CardTitle>
              <CardDescription>Calculate your credit card debt repayment plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/credit-card-calculator">Go to Credit Card Calculator</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}