"use client";

import type { Summary } from "@/types/waste-report";

interface SummaryCardsProps {
  summary: Summary;
  loading: boolean;
}

export function SummaryCards({ summary, loading }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 animate-pulse"
          >
            <div className="h-2 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-2 bg-gray-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Waste Today",
      value: `${summary.totalWaste.toLocaleString()} kg`,
      sub: "Collected across all urban areas",
      accent: "from-emerald-50 to-teal-50 border-emerald-100",
      valueColor: "text-emerald-700",
    },
    {
      label: "Total Urban Areas",
      value: summary.urbanAreas,
      sub: "Active monitoring zones",
      accent: "from-blue-50 to-indigo-50 border-blue-100",
      valueColor: "text-blue-700",
    },
    {
      label: "Pending Reports",
      value: summary.pendingReports,
      sub: "Awaiting action from teams",
      accent: "from-amber-50 to-orange-50 border-amber-100",
      valueColor: "text-amber-700",
    },
    {
      label: "Waste Distribution",
      value: null,
      sub: null,
      accent: "from-violet-50 to-purple-50 border-violet-100",
      valueColor: "text-violet-700",
      custom: (() => {
        const dist = summary.wasteDistribution;
        const allTypes = [
          { label: "Plastic",   pct: dist.plastic   ?? 0, color: "bg-blue-400" },
          { label: "Organic",   pct: dist.organic   ?? 0, color: "bg-emerald-400" },
          { label: "Mixed",     pct: dist.mixed     ?? 0, color: "bg-amber-400" },
          { label: "Hazardous", pct: dist.hazardous ?? 0, color: "bg-red-400" },
        ];
        // Chỉ hiện loại có % > 0 (loại bỏ loại không có trong data thật)
        const visible = allTypes.filter(t => t.pct > 0);
        const list = visible.length > 0 ? visible : allTypes; // fallback: show all nếu tất cả = 0

        return (
          <div className="mt-2 space-y-1.5">
            {list.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                  <span>{item.label}</span>
                  <span className="font-medium text-gray-700">{item.pct}%</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        );
      })(),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-gradient-to-br ${card.accent} border rounded-2xl shadow-sm p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            {card.label}
          </p>
          {card.value !== null && (
            <p className={`text-2xl font-bold mt-1 ${card.valueColor}`}>
              {card.value}
            </p>
          )}
          {card.sub && (
            <p className="text-[10px] text-gray-400 mt-0.5">{card.sub}</p>
          )}
          {card.custom}
        </div>
      ))}
    </div>
  );
}
