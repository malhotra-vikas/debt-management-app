// Thas was all AI Solution
//import MerlinChat from "@/components/merlin";

// This is mixed AI solution
import Merlin from "@/components/merlin-botpress"


export default function MerlinBotPage() {
  return (
    <main className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-8">
        <Merlin />
      </div>
    </main>
  )
}