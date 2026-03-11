interface DashboardCardProps {
  title: string
  description: string
  onClick?: () => void
}

export default function DashboardCard({ title, description, onClick }: DashboardCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="p-5">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}
