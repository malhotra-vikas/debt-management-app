import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon } from "lucide-react"

export function HorizontalHeader() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-blue-600">Debt Management</h1>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <SunIcon className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button variant="ghost">Help</Button>
        <Button variant="ghost">Settings</Button>
      </div>
    </header>
  )
}