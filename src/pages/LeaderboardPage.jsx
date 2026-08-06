import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Trophy } from 'lucide-react'

const MEDALS = [
  {
    rank: 1,
    label: '1st Place',
    icon: '🥇',
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    shadow: '0 8px 32px rgba(253,160,133,0.45)',
    border: '#f6d365',
    size: 'text-6xl',
    ring: 'ring-4 ring-yellow-300',
    scale: 'scale-110',
    labelColor: '#b45309',
    bg: '#fffbeb',
  },
  {
    rank: 2,
    label: '2nd Place',
    icon: '🥈',
    gradient: 'linear-gradient(135deg, #e0e0e0 0%, #a0a0a0 100%)',
    shadow: '0 8px 24px rgba(120,120,120,0.35)',
    border: '#d1d5db',
    size: 'text-5xl',
    ring: 'ring-4 ring-gray-300',
    scale: 'scale-100',
    labelColor: '#6b7280',
    bg: '#f9fafb',
  },
  {
    rank: 3,
    label: '3rd Place',
    icon: '🥉',
    gradient: 'linear-gradient(135deg, #f4a261 0%, #c05c2f 100%)',
    shadow: '0 8px 24px rgba(192,92,47,0.35)',
    border: '#fed7aa',
    size: 'text-5xl',
    ring: 'ring-4 ring-orange-300',
    scale: 'scale-100',
    labelColor: '#92400e',
    bg: '#fff7ed',
  },
]

export default function LeaderboardPage() {
  const [topThree, setTopThree] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalParticipants, setTotalParticipants] = useState(0)

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)

      // Fetch all approved transactions for committee + head members (those in the point system)
      const { data: members } = await supabase
        .from('users')
        .select('id')
        .in('role', ['committee', 'head'])

      if (!members || members.length === 0) {
        setLoading(false)
        return
      }

      setTotalParticipants(members.length)
      const ids = members.map(m => m.id)

      const { data: txData } = await supabase
        .from('point_transactions')
        .select('member_id, amount')
        .in('member_id', ids)
        .eq('status', 'approved')

      // Tally up balances per member
      const balances = {}
      ids.forEach(id => { balances[id] = 0 })
      txData?.forEach(tx => {
        balances[tx.member_id] = (balances[tx.member_id] ?? 0) + tx.amount
      })

      // Sort descending, take top 3
      const sorted = Object.values(balances).sort((a, b) => b - a).slice(0, 3)
      setTopThree(sorted)
      setLoading(false)
    }

    fetchLeaderboard()
  }, [])

  // Reorder for podium display: 2nd, 1st, 3rd
  const podiumOrder = [1, 0, 2] // indices into topThree for left→right (2nd, 1st, 3rd)

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500
                          flex items-center justify-center shadow-lg text-3xl">
            🏆
          </div>
        </div>
        <h1 className="text-3xl font-black text-green-900">Leaderboard</h1>
        <p className="text-green-600 text-sm max-w-sm mx-auto">
          Top performers across all departments.
          Names are kept anonymous — only the points speak!
        </p>
      </div>

      {/* Prize banner */}
      <div className="rounded-2xl overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #2d6a4f 0%, #40916c 60%, #74c69d 100%)' }}>
        <div className="px-6 py-5 flex items-center gap-4">
          <div className="text-4xl flex-shrink-0">✈️</div>
          <div>
            <p className="text-white font-black text-lg leading-tight">End-of-Year Trip Sponsorship</p>
            <p className="text-green-200 text-sm mt-0.5">
              The <strong className="text-white">Top 3 members</strong> will be sponsored for the end-of-year club trip. Keep earning!
            </p>
          </div>
          <div className="ml-auto text-5xl flex-shrink-0 opacity-30 hidden sm:block">🌍</div>
        </div>
      </div>

      {/* Podium */}
      {loading ? (
        <div className="flex justify-center items-end gap-6 pt-6">
          {[140, 190, 120].map((h, i) => (
            <div key={i} className="skeleton rounded-2xl w-32" style={{ height: h }} />
          ))}
        </div>
      ) : topThree.length === 0 ? (
        <div className="card empty-state">
          <Trophy size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No data yet</p>
          <p className="text-sm mt-1">Points will appear here once they're approved.</p>
        </div>
      ) : (
        <>
          {/* Podium blocks — displayed 2nd, 1st, 3rd */}
          <div className="flex justify-center items-end gap-4 pt-4">
            {podiumOrder.map((dataIdx, podiumIdx) => {
              const medal = MEDALS[dataIdx]
              const pts = topThree[dataIdx]
              if (pts === undefined) return null

              const podiumHeights = ['h-40', 'h-56', 'h-36'] // 2nd, 1st, 3rd heights
              const height = podiumHeights[podiumIdx]

              return (
                <div key={medal.rank} className="flex flex-col items-center gap-3">
                  {/* Medal + points card */}
                  <div
                    className={`flex flex-col items-center justify-center rounded-2xl px-6 py-5
                      transition-transform duration-300 hover:-translate-y-1 cursor-default
                      ${dataIdx === 0 ? 'w-40' : 'w-32'}`}
                    style={{
                      background: medal.bg,
                      boxShadow: medal.shadow,
                      border: `2px solid ${medal.border}`,
                    }}
                  >
                    <span className={`${medal.size} mb-1`}>{medal.icon}</span>
                    <p className="font-black text-3xl" style={{ color: medal.labelColor }}>
                      {pts}
                    </p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: medal.labelColor }}>
                      pts
                    </p>
                    <div className="mt-2 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg"
                         title="Anonymous">
                      🙈
                    </div>
                    <p className="text-xs font-bold mt-1" style={{ color: medal.labelColor }}>
                      {medal.label}
                    </p>
                  </div>

                  {/* Podium column */}
                  <div
                    className={`${height} w-full rounded-t-xl flex items-center justify-center font-black text-white text-2xl`}
                    style={{ background: medal.gradient }}
                  >
                    {medal.rank}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4 text-center">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Total Participants</p>
              <p className="text-2xl font-black text-green-800">{totalParticipants}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1">Top Score</p>
              <p className="text-2xl font-black points-positive">{topThree[0] ?? 0}</p>
            </div>
          </div>
        </>
      )}

      {/* Footer note */}
      <p className="text-center text-xs text-green-500 pb-4">
        🔒 Names are hidden to keep it fair — focus on the journey, not the competition.
        <br />Only approved points count towards rankings.
      </p>
    </div>
  )
}
