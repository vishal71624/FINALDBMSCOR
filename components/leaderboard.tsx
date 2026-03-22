'use client'

import { useEffect, useState, useCallback } from 'react'
import { useGameStore, LeaderboardEntry } from '@/lib/game-store'
import { getLeaderboard } from '@/lib/supabase/db-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Medal, 
  ArrowLeft, 
  Crown,
  Zap,
  TrendingUp,
  Users,
  Star,
  Flame,
  RefreshCcw,
  Loader2
} from 'lucide-react'

export function Leaderboard() {
  const { setView, currentPlayer, isAdmin, players } = useGameStore()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [animate, setAnimate] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load ALL players from database on mount, fallback to local store
  const loadLeaderboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      const allPlayers = await getLeaderboard()
      // Sort by score descending and create leaderboard entries
      const sortedPlayers = allPlayers
        .sort((a, b) => b.score - a.score)
        .map((player, index) => ({
          rank: index + 1,
          player,
          totalScore: player.score
        }))
      setLeaderboard(sortedPlayers)
    } catch (error) {
      console.error('Failed to load leaderboard from DB, using local store:', error)
      // Fallback to local store data
      const localPlayers = Object.values(players)
      const sortedPlayers = localPlayers
        .sort((a, b) => b.score - a.score)
        .map((player, index) => ({
          rank: index + 1,
          player,
          totalScore: player.score
        }))
      setLeaderboard(sortedPlayers)
    } finally {
      setIsLoading(false)
    }
  }, [players])

  useEffect(() => {
    loadLeaderboardData()
  }, [loadLeaderboardData])

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100)
    return () => clearTimeout(timer)
  }, [leaderboard])

  // Get current player's rank
  const currentPlayerRank = leaderboard.findIndex(e => e.player.id === currentPlayer?.id) + 1

  // Stats
  const totalPlayers = leaderboard.length
  const averageScore = Math.round(leaderboard.reduce((acc, e) => acc + e.totalScore, 0) / (totalPlayers || 1))
  const topScore = leaderboard[0]?.totalScore || 0

  return (
    <div className="min-h-screen bg-background relative overflow-hidden z-50">
      {/* Animated background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.06)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[150px]" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setView(isAdmin ? 'admin' : 'dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isAdmin ? 'Back to Admin' : 'Back to Dashboard'}
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Live Leaderboard</h1>
            </div>
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
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
            {currentPlayer && (
              <StatCard
                icon={<Star className="w-5 h-5" />}
                label="Your Rank"
                value={`#${currentPlayerRank}`}
                color="text-accent"
              />
            )}
          </div>

          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="flex items-end justify-center gap-4 mb-12">
              {/* 2nd Place */}
              <div className={`w-36 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
                <div className="text-center mb-3">
                  <Medal className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="font-semibold mt-1 truncate">{leaderboard[1]?.player.name}</p>
                  <p className="text-xs text-muted-foreground">2nd Place</p>
                </div>
                <div className="h-24 bg-gradient-to-t from-gray-500/20 to-gray-400/10 rounded-t-lg border border-gray-500/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-400">{leaderboard[1]?.totalScore}</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className={`w-40 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '0ms' }}>
                <div className="text-center mb-3">
                  <Crown className="w-10 h-10 mx-auto text-yellow-500 animate-pulse" />
                  <p className="font-bold text-lg mt-1 truncate">{leaderboard[0]?.player.name}</p>
                  <p className="text-xs text-muted-foreground">1st Place</p>
                </div>
                <div className="h-32 bg-gradient-to-t from-yellow-500/20 to-yellow-400/10 rounded-t-lg border border-yellow-500/30 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(234,179,8,0.3),transparent_70%)]" />
                  <span className="text-3xl font-bold text-yellow-500 relative z-10">{leaderboard[0]?.totalScore}</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className={`w-36 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '400ms' }}>
                <div className="text-center mb-3">
                  <Medal className="w-8 h-8 mx-auto text-amber-700" />
                  <p className="font-semibold mt-1 truncate">{leaderboard[2]?.player.name}</p>
                  <p className="text-xs text-muted-foreground">3rd Place</p>
                </div>
                <div className="h-20 bg-gradient-to-t from-amber-700/20 to-amber-600/10 rounded-t-lg border border-amber-700/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-amber-700">{leaderboard[2]?.totalScore}</span>
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
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={entry.player.id}
                    className={`flex items-center gap-4 p-4 transition-all duration-500 ${
                      entry.player.id === currentPlayer?.id 
                        ? 'bg-primary/10 border-l-2 border-l-primary' 
                        : 'hover:bg-muted/30'
                    } ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
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
                      <p className="font-semibold truncate">
                        {entry.player.name}
                        {entry.player.id === currentPlayer?.id && (
                          <Badge variant="outline" className="ml-2 text-xs border-primary/50 text-primary">You</Badge>
                        )}
                      </p>
                      {/* Only show player code to admins or to the player themselves */}
                      {isAdmin ? (
                        <p className="text-xs text-muted-foreground">Code: {entry.player.id}</p>
                      ) : entry.player.id === currentPlayer?.id ? (
                        <p className="text-xs text-muted-foreground">Your Code: {entry.player.id}</p>
                      ) : entry.player.college ? (
                        <p className="text-xs text-muted-foreground">{entry.player.college}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Participant</p>
                      )}
                    </div>

                    {/* Round Scores */}
                    <div className="hidden md:flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">R1</p>
                        <p className="font-mono text-primary">{entry.player.round1Score}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">R2</p>
                        <p className="font-mono text-accent">{entry.player.round2Score}</p>
                      </div>
                    </div>

                    {/* Total Score */}
                    <div className="text-right">
                      <p className={`text-xl font-bold ${
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

                {isLoading && (
                  <div className="p-12 text-center text-muted-foreground">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                    <p>Loading leaderboard...</p>
                  </div>
                )}

                {!isLoading && leaderboard.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No players on the leaderboard yet</p>
                    <p className="text-sm mt-1">Complete challenges to appear here</p>
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
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`${color} opacity-50`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
