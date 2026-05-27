import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import DashboardCard from '../components/dashboard/DashboardCard'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface RecentEvaluation {
  id: string
  athlete_name: string
  created_at: string
  notes?: string
}

interface WeatherData {
  temperature: number
  weathercode: number
  locationName?: string
}

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getWeatherInfo(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: 'Clear sky', emoji: '☀️' }
  if (code >= 1 && code <= 3) return { label: 'Partly cloudy', emoji: '⛅' }
  if (code >= 45 && code <= 48) return { label: 'Foggy', emoji: '🌫️' }
  if (code >= 51 && code <= 55) return { label: 'Drizzle', emoji: '🌧️' }
  if (code >= 61 && code <= 65) return { label: 'Rain', emoji: '🌧️' }
  if (code >= 71 && code <= 77) return { label: 'Snow', emoji: '❄️' }
  if (code >= 80 && code <= 82) return { label: 'Rain showers', emoji: '🌦️' }
  if (code >= 85 && code <= 86) return { label: 'Snow showers', emoji: '🌨️' }
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', emoji: '⛈️' }
  return { label: 'Unknown', emoji: '🌡️' }
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
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [athletesEvaluated, setAthletesEvaluated] = useState(0)

  const fetchWeather = useCallback(() => {
    setWeatherLoading(true)
    setWeatherError(null)

    if (!navigator.geolocation) {
      setWeatherError('Location unavailable')
      setWeatherLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const [weatherRes, geoRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`),
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`),
          ])
          if (!weatherRes.ok) throw new Error('Weather fetch failed')
          const data = await weatherRes.json()
          const geoData = await geoRes.json()
          const locationName = geoData.address?.city || geoData.address?.town || geoData.address?.village || undefined
          setWeather({
            temperature: data.current_weather.temperature,
            weathercode: data.current_weather.weathercode,
            locationName,
          })
        } catch {
          setWeatherError('Weather unavailable')
        } finally {
          setWeatherLoading(false)
        }
      },
      () => {
        setWeatherError('Location unavailable')
        setWeatherLoading(false)
      },
      { timeout: 8000 }
    )
  }, [])

  useEffect(() => {
    if (coach) {
      loadDashboardData()
    }
  }, [coach])

  useEffect(() => {
    fetchWeather()
  }, [fetchWeather])

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

    // Get count of distinct athletes evaluated (for progress indicator)
    if (myAthletesCount && myAthletesCount > 0) {
      const { data: evaluatedAthletes } = await supabase
        .from('evaluations')
        .select('athlete_id')
        .eq('coach_id', coach.id)

      if (evaluatedAthletes) {
        const uniqueAthletes = new Set(evaluatedAthletes.map(e => e.athlete_id))
        setAthletesEvaluated(uniqueAthletes.size)
      }
    }

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

  const greeting = getTimeGreeting()
  const weatherInfo = weather ? getWeatherInfo(weather.weathercode) : null
  const evalProgress = stats.myAthletes > 0
    ? Math.round((athletesEvaluated / stats.myAthletes) * 100)
    : 0

  return (
    <div className="p-5 sm:p-4 lg:p-8 space-y-6">
      {/* Greeting + Date */}
      <div className="border-l-4 border-freestyle-red pl-4 pt-8 pb-2">
        <h1 className="text-3xl sm:text-3xl font-bold tracking-tight text-gray-900">
          {greeting}{coach?.full_name ? `, ` : ''}{coach?.full_name ? <span className="text-freestyle-red">{coach.full_name}</span> : ''}
        </h1>
        <p className="text-gray-500 text-sm font-medium mt-1">{formatDate()}</p>
      </div>

      {/* Weather Widget */}
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg p-4">
        {weatherLoading ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌤️</span>
            <div>
              <p className="text-gray-400 text-sm">Loading weather…</p>
            </div>
          </div>
        ) : weatherError ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <p className="text-gray-500 text-sm font-medium">{weatherError}</p>
            </div>
          </div>
        ) : weather && weatherInfo ? (
          <div className="flex items-center gap-3">
            <span className="text-3xl">{weatherInfo.emoji}</span>
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{Math.round(weather.temperature)}°C</p>
                {weather.locationName && (
                  <p className="text-gray-500 text-sm font-medium">{weather.locationName}</p>
                )}
              </div>
              <p className="text-gray-500 text-sm">{weatherInfo.label}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Stats Overview */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3 sm:mb-4">Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <div onClick={() => navigate('/roster')} className="bg-white p-3 sm:p-6 rounded-xl shadow-md hover:shadow-xl cursor-pointer transition-shadow border-t-4 border-freestyle-red">
            <p className="text-sm text-gray-500">My Athletes</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">
              {loading ? '--' : stats.myAthletes}
            </p>
          </div>
          <div onClick={() => navigate('/roster')} className="bg-white p-3 sm:p-6 rounded-xl shadow-md hover:shadow-xl cursor-pointer transition-shadow border-t-4 border-green-500">
            <p className="text-sm text-gray-500">Evaluations Today</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">
              {loading ? '--' : stats.evaluationsToday}
            </p>
          </div>
          <div onClick={() => navigate('/roster')} className="bg-white p-3 sm:p-6 rounded-xl shadow-md hover:shadow-xl cursor-pointer transition-shadow border-t-4 border-gray-400">
            <p className="text-sm text-gray-500">Total Evaluations</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
              {loading ? '--' : stats.totalEvaluations}
            </p>
          </div>
        </div>

        {/* Season Progress */}
        {stats.myAthletes > 0 && !loading && (
          <div className="mt-4 bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Athletes Evaluated</p>
              <p className="text-sm font-medium text-gray-500">
                {athletesEvaluated}/{stats.myAthletes}
              </p>
            </div>
            <div className="bg-gray-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-red-500 to-red-600 rounded-full h-2 transition-all duration-500"
                style={{ width: `${evalProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
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

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-xl shadow-md border-l-4 border-freestyle-red">
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
            <div className="divide-y divide-gray-100">
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
                    <span className="text-sm text-gray-500">
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
