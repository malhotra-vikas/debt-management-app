import QuestionBot from '@/components/merlin'

export default function MerlinBotPage() {
  return (
    <main className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Merlin Bot</h1>
        <QuestionBot />
      </div>
    </main>
  )
}