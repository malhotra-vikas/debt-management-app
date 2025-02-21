import QuestionBot from '@/components/merlin'

export default function MerlinBotPage() {
  return (
    <main className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-8">
        <QuestionBot />
      </div>
    </main>
  )
}