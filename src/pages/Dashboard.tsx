import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import DashboardCard from '../components/dashboard/DashboardCard'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface RecentEvaluation {
  id: string
  athlete_name: string
  created_at: string
  notes?: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { coach } = useAuth()
  const [stats, setStats] = useState({
    myAthletes: 0,
    evaluationsToday: 0,
    templates: 0,
    totalEvaluations: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentEvaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (coach) {
      loadDashboardData()
    }
  }, [coach])

  async function loadDashboardData() {
    if (!coach) return
    setLoading(true)

    // Get my roster count
    const { count: myAthletesCount } = await supabase
      .from('coach_roster')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coach.id)

    // Get evaluations today
    const today = new Date().toISOString().split('T')[0]
    const { count: todayEvaluations } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coach.id)
      .gte('created_at', today)

    // Get templates count
    const { count: templatesCount } = await supabase
      .from('evaluation_templates')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coach.id)

    // Get total evaluations this season
    const { count: totalEvaluations } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', coach.id)

    setStats({
      myAthletes: myAthletesCount || 0,
      evaluationsToday: todayEvaluations || 0,
      templates: templatesCount || 0,
      totalEvaluations: totalEvaluations || 0
    })

    // Get recent evaluations with athlete names
    const { data: recentEvals } = await supabase
      .from('evaluations')
      .select('id, created_at, notes, athlete_id')
      .eq('coach_id', coach.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentEvals && recentEvals.length > 0) {
      // Get athlete names for the evaluations
      const athleteIds = recentEvals.map(e => e.athlete_id)
      const { data: athletes } = await supabase
        .from('athletes')
        .select('id, full_name')
        .in('id', athleteIds)

      const athleteMap = new Map(athletes?.map(a => [a.id, a.full_name]))

      const activity: RecentEvaluation[] = recentEvals.map(e => ({
        id: e.id,
        athlete_name: athleteMap.get(e.athlete_id) || 'Unknown Athlete',
        created_at: e.created_at,
        notes: e.notes
      }))

      setRecentActivity(activity)
    }

    setLoading(false)
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome Back{coach?.full_name ? `, ${coach.full_name}` : ''}
        </h1>
        <p className="text-gray-500 mt-2">Manage your athletes and evaluations</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardCard
            title="My Roster"
            description="View athletes and start evaluations"
            onClick={() => navigate('/roster')}
          />
          <DashboardCard
            title="View Evaluations"
            description="Review past athlete evaluations"
            onClick={() => navigate('/roster')}
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">My Athletes</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {loading ? '--' : stats.myAthletes}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Evaluations Today</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {loading ? '--' : stats.evaluationsToday}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Evaluations</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {loading ? '--' : stats.totalEvaluations}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 py-8">No recent activity</p>
              <p className="text-sm text-gray-400">Start by adding athletes to your roster and creating evaluations</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        Evaluated {activity.athlete_name}
                      </p>
                      {activity.notes && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {activity.notes}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">
                      {formatTimeAgo(activity.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
