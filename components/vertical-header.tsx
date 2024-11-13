import { Button } from "@/components/ui/button"
import { HomeIcon, CreditCardIcon, PieChartIcon, SettingsIcon, HelpCircleIcon } from 'lucide-react'

export function VerticalHeader() {
  return (
    <aside className="bg-white border-r border-gray-200 w-16 flex flex-col items-center py-4 space-y-4">
      <Button variant="ghost" size="icon" className="rounded-full">
        <HomeIcon className="h-5 w-5" />
        <span className="sr-only">Home</span>
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full">
        <CreditCardIcon className="h-5 w-5" />
        <span className="sr-only">Debts</span>
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full">
        <PieChartIcon className="h-5 w-5" />
        <span className="sr-only">Reports</span>
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full">
        <SettingsIcon className="h-5 w-5" />
        <span className="sr-only">Settings</span>
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full">
        <HelpCircleIcon className="h-5 w-5" />
        <span className="sr-only">Help</span>
      </Button>
    </aside>
  )
}