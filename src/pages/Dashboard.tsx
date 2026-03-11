import { useNavigate } from 'react-router-dom'
import DashboardCard from '../components/dashboard/DashboardCard'

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-500 mt-2">Manage your athletes and evaluations</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            title="My Roster"
            description="View athletes and start evaluations"
            onClick={() => navigate('/roster')}
          />
          <DashboardCard
            title="Evaluation Templates"
            description="Manage your performance metrics templates"
            onClick={() => navigate('/templates')}
          />
          <DashboardCard
            title="Import Athletes"
            description="Import from CSV or Google Sheets"
            onClick={() => navigate('/import')}
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Athletes</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Evaluations Today</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Templates</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">This Season</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">--</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        </div>
      </div>
    </div>
  )
}
