import { AlertCircle } from 'lucide-react'

interface UrgentIndicatorProps {
  deadline: Date
}

export function UrgentIndicator({ deadline }: UrgentIndicatorProps) {
  const now = new Date()
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Only show if less than 3 days away
  if (daysUntil > 3) {
    return null
  }

  return (
    <div className="flex items-center gap-1 rounded border border-red-500 bg-red-50 px-2 py-1 dark:bg-red-950">
      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      <span className="text-xs font-medium text-red-600 dark:text-red-400">
        {daysUntil <= 0 ? 'Deadline Passed' : `${daysUntil}d left`}
      </span>
    </div>
  )
}
