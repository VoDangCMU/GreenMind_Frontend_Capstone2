"use client"

const heroStats = [
  { label: "Activities", value: "0" },
  { label: "Households", value: "0" },
  { label: "Avg Plastic", value: "0%" },
]

interface HeroStatsProps {
  data: {
    activities: number
    households: number
    avgPlastic: number
  }
}

export function HeroStats({ data }: HeroStatsProps) {
  const stats = [
    { label: "Activities", value: data.activities.toLocaleString() },
    { label: "Households", value: data.households.toLocaleString() },
    { label: "Avg Plastic", value: `${data.avgPlastic}%` },
  ]

  return (
    <div className="hidden lg:flex gap-8">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="text-center animate-fade-in-up"
          style={{ animationDelay: `${0.3 + index * 0.1}s` }}
        >
          <p className="text-3xl font-bold text-white">{stat.value}</p>
          <p className="text-sm text-white/70">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}