import { MultiStepForm } from '@/components/multi-step-form'
import CreditCardCalculator from './credit-card-calculator'

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Debt Management Tools</h1>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Debt Information Form</h2>
          <MultiStepForm />
        </section>

        <hr className="my-8 border-t border-gray-300" />

        <section>
          <h2 className="text-2xl font-semibold mb-4">Credit Card Debt Calculator</h2>
          <CreditCardCalculator />
        </section>
      </div>
    </main>
  )
}