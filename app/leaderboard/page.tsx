'use client'

import { useEffect, useState, useCallback } from 'react'
import { LeaderboardEntry } from '@/lib/game-store'
import { getLeaderboard } from '@/lib/supabase/db-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Trophy, 
  Medal, 
  Crown,
  Zap,
  TrendingUp,
  Users,
  Flame,
  RefreshCcw,
  Loader2,
  Building
} from 'lucide-react'

export default function PublicLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [animate, setAnimate] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const loadLeaderboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      const allPlayers = await getLeaderboard()
      const sortedPlayers = allPlayers
        .filter(p => !p.isDisqualified)
        .sort((a, b) => b.score - a.score)
        .map((player, index) => ({
          rank: index + 1,
          player,
          totalScore: player.score
        }))
      setLeaderboard(sortedPlayers)
      setLastRefresh(new Date())
    } catch {
      // Silently handle fetch errors during auto-refresh
      // Keep existing leaderboard data
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLeaderboardData()
  }, [loadLeaderboardData])

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100)
    return () => clearTimeout(timer)
  }, [leaderboard])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      loadLeaderboardData()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [autoRefresh, loadLeaderboardData])

  // Stats
  const totalPlayers = leaderboard.length
  const averageScore = Math.round(leaderboard.reduce((acc, e) => acc + e.totalScore, 0) / (totalPlayers || 1))
  const topScore = leaderboard[0]?.totalScore || 0

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.06)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[150px]" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">ITRIX 2026</h1>
                <p className="text-sm text-muted-foreground">Live Leaderboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'border-neon-green/50 text-neon-green' : 'border-muted-foreground/30 text-muted-foreground'}
              >
                {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadLeaderboardData}
                disabled={isLoading}
                className="border-primary/50 text-primary"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCcw className="w-4 h-4" />
                )}
                <span className="ml-2">Refresh</span>
              </Button>
              <span className="text-xs text-muted-foreground">
                Last: {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Total Players"
              value={totalPlayers.toString()}
              color="text-primary"
            />
            <StatCard
              icon={<Zap className="w-5 h-5" />}
              label="Top Score"
              value={topScore.toString()}
              color="text-neon-green"
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Average Score"
              value={averageScore.toString()}
              color="text-neon-orange"
            />
          </div>

          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="flex items-end justify-center gap-6 mb-12">
              {/* 2nd Place */}
              <div className={`w-44 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
                <div className="text-center mb-3">
                  <Medal className="w-10 h-10 mx-auto text-gray-400" />
                  <p className="font-semibold text-lg mt-2 truncate">{leaderboard[1]?.player.name}</p>
                  <p className="text-xs text-muted-foreground">{leaderboard[1]?.player.college || '-'}</p>
                  <p className="text-xs text-muted-foreground">{leaderboard[1]?.player.department || '-'} - {leaderboard[1]?.player.yearOfStudy || '-'}</p>
                </div>
                <div className="h-28 bg-gradient-to-t from-gray-500/20 to-gray-400/10 rounded-t-lg border border-gray-500/30 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-400">{leaderboard[1]?.totalScore}</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className={`w-48 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '0ms' }}>
                <div className="text-center mb-3">
                  <Crown className="w-12 h-12 mx-auto text-yellow-500 animate-pulse" />
                  <p className="font-bold text-xl mt-2 truncate">{leaderboard[0]?.player.name}</p>
                  <p className="text-sm text-muted-foreground">{leaderboard[0]?.player.college || '-'}</p>
                  <p className="text-xs text-muted-foreground">{leaderboard[0]?.player.department || '-'} - {leaderboard[0]?.player.yearOfStudy || '-'}</p>
                </div>
                <div className="h-36 bg-gradient-to-t from-yellow-500/20 to-yellow-400/10 rounded-t-lg border border-yellow-500/30 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(234,179,8,0.3),transparent_70%)]" />
                  <span className="text-4xl font-bold text-yellow-500 relative z-10">{leaderboard[0]?.totalScore}</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className={`w-44 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '400ms' }}>
                <div className="text-center mb-3">
                  <Medal className="w-10 h-10 mx-auto text-amber-700" />
                  <p className="font-semibold text-lg mt-2 truncate">{leaderboard[2]?.player.name}</p>
                  <p className="text-xs text-muted-foreground">{leaderboard[2]?.player.college || '-'}</p>
                  <p className="text-xs text-muted-foreground">{leaderboard[2]?.player.department || '-'} - {leaderboard[2]?.player.yearOfStudy || '-'}</p>
                </div>
                <div className="h-24 bg-gradient-to-t from-amber-700/20 to-amber-600/10 rounded-t-lg border border-amber-700/30 flex items-center justify-center">
                  <span className="text-3xl font-bold text-amber-700">{leaderboard[2]?.totalScore}</span>
                </div>
              </div>
            </div>
          )}

          {/* Full Rankings Table */}
          <Card className="border-border/50 bg-card/80 overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border/50">
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                Full Rankings
                {autoRefresh && (
                  <span className="ml-auto text-sm font-normal text-neon-green flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                    Auto-refreshing every 10s
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={entry.player.id}
                    className={`flex items-center gap-4 p-4 transition-all duration-500 hover:bg-muted/30 ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    {/* Rank */}
                    <div className="w-12 text-center">
                      {index === 0 ? (
                        <Crown className="w-6 h-6 mx-auto text-yellow-500" />
                      ) : index === 1 ? (
                        <Medal className="w-6 h-6 mx-auto text-gray-400" />
                      ) : index === 2 ? (
                        <Medal className="w-6 h-6 mx-auto text-amber-700" />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0 
                        ? 'bg-yellow-500/20 text-yellow-500' 
                        : index === 1 
                          ? 'bg-gray-400/20 text-gray-400'
                          : index === 2
                            ? 'bg-amber-700/20 text-amber-700'
                            : 'bg-primary/20 text-primary'
                    }`}>
                      {entry.player.name.charAt(0)}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{entry.player.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {entry.player.college || '-'}
                        </span>
                        <span>|</span>
                        <span>{entry.player.department || '-'}</span>
                        <span>|</span>
                        <span>{entry.player.yearOfStudy || '-'}</span>
                      </div>
                    </div>

                    {/* Round Scores */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Round 1</p>
                        <p className="font-mono text-lg text-primary">{entry.player.round1Score}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Round 2</p>
                        <p className="font-mono text-lg text-accent">{entry.player.round2Score}</p>
                      </div>
                    </div>

                    {/* Total Score */}
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        index === 0 
                          ? 'text-yellow-500' 
                          : index === 1 
                            ? 'text-gray-400'
                            : index === 2
                              ? 'text-amber-700'
                              : 'text-foreground'
                      }`}>
                        {entry.totalScore}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}

                {isLoading && leaderboard.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                    <p>Loading leaderboard...</p>
                  </div>
                )}

                {!isLoading && leaderboard.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No players on the leaderboard yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <Card className="border-border/50 bg-card/80">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`${color} opacity-50`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
