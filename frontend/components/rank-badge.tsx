interface RankBadgeProps {
  score: number
}

export function RankBadge({ score }: RankBadgeProps) {
  // Determine color based on score
  let bgColor = 'bg-destructive'
  let textColor = 'text-destructive-foreground'

  if (score >= 80) {
    bgColor = 'bg-green-600'
    textColor = 'text-white'
  } else if (score >= 70) {
    bgColor = 'bg-blue-600'
    textColor = 'text-white'
  } else if (score >= 60) {
    bgColor = 'bg-amber-600'
    textColor = 'text-white'
  } else {
    bgColor = 'bg-red-600'
    textColor = 'text-white'
  }

  return (
    <div className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${bgColor} ${textColor} text-xs font-bold`}>
      {score}
    </div>
  )
}
