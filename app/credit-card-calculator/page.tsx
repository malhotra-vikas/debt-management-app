import CreditCardCalculator from '@/components/credit-card-calculator'

export default function CreditCardCalculatorPage() {
  return (
    <main className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Credit Card Debt Calculator</h1>
        <CreditCardCalculator />
      </div>
    </main>
  )
}