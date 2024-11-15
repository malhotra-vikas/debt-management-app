import { MultiStepForm } from '@/components/multi-step-form'

export default function DebtInformationForm() {
  return (
    <main className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Debt Information Form</h1>
        <MultiStepForm />
      </div>
    </main>
  )
}