interface DashboardCardProps {
  title: string
  description: string
  onClick?: () => void
}

export default function DashboardCard({ title, description, onClick }: DashboardCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white overflow-hidden rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 active:scale-[0.98] border-l-4 border-freestyle-red cursor-pointer"
    >
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}
