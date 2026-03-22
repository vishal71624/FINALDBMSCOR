'use client'

import { useGameStore } from '@/lib/game-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  LogOut, 
  Trophy, 
  Lock, 
  Play, 
  Zap, 
  Target, 
  Code,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react'

export function Dashboard() {
  const { 
    currentPlayer, 
    logout, 
    setView, 
    startRound1,
    startRound2,
    tabSwitchCount,
    maxTabSwitches,
    violations
  } = useGameStore()

  if (!currentPlayer) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-bold text-lg text-foreground">ITRIX 2026</h1>
              <p className="text-xs text-muted-foreground">IST, CEG, Anna University</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              className="border-primary/50 text-primary hover:bg-primary/10"
              onClick={() => setView('leaderboard')}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Disqualification Warning */}
        {currentPlayer.isDisqualified && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Disqualified</p>
              <p className="text-sm text-muted-foreground">You have been disqualified due to multiple proctoring violations.</p>
            </div>
          </div>
        )}

        {/* Player Info Card */}
        <Card className="border-border/50 bg-card/80 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {currentPlayer.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{currentPlayer.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {tabSwitchCount > 0 && (
                      <Badge variant="outline" className={tabSwitchCount >= 2 ? 'border-destructive text-destructive' : 'border-neon-orange text-neon-orange'}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {tabSwitchCount}/{maxTabSwitches} Warnings
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-4xl font-bold text-primary">{currentPlayer.score}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Violations Log */}
        {violations.length > 0 && (
          <Card className="border-neon-orange/30 bg-neon-orange/5 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-neon-orange">
                <AlertTriangle className="w-4 h-4" />
                Proctoring Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {violations.slice(-3).map((v, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {v}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Round Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Round 1 */}
          <Card className="border-border/50 bg-card/80 overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="mb-2 border-primary/50 text-primary">
                    Round 1
                  </Badge>
                  <CardTitle className="text-xl text-foreground">Scenario Challenge</CardTitle>
                  <CardDescription>30 scenario-based questions</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{currentPlayer.round1Score}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {currentPlayer.round1Completed ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-neon-green" />
                  <p className="text-lg font-semibold text-neon-green">Round 1 Complete!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You scored {currentPlayer.round1Score} points
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span>15 Easy + 10 Medium + 5 Hard questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>45 minutes total time</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span>Navigate freely between questions</span>
                    </div>
                  </div>

                  <Button 
                    onClick={startRound1}
                    disabled={currentPlayer.isDisqualified}
                    className="w-full h-12 text-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Round 1
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Round 2 */}
          <Card className={`border-border/50 bg-card/80 overflow-hidden ${!currentPlayer.round2Enabled ? 'opacity-60' : ''}`}>
            <CardHeader className="bg-accent/5 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="mb-2 border-accent/50 text-accent">
                    Round 2
                  </Badge>
                  <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                    SQL Challenge Arena
                    {!currentPlayer.round2Enabled && <Lock className="w-4 h-4 text-muted-foreground" />}
                  </CardTitle>
                  <CardDescription>10 SQL query challenges</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent">{currentPlayer.round2Score}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {currentPlayer.round2Completed ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-neon-green" />
                  <p className="text-lg font-semibold text-neon-green">Round 2 Complete!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You scored {currentPlayer.round2Score} points
                  </p>
                </div>
              ) : !currentPlayer.round2Enabled ? (
                <div className="text-center py-6">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium">Round 2 Locked</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete Round 1 and wait for admin approval
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-accent" />
                      <span>10 SQL query challenges</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent" />
                      <span>30 minutes total time</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent" />
                      <span>Write real SQL queries</span>
                    </div>
                  </div>

                  <Button 
                    onClick={startRound2}
                    disabled={currentPlayer.isDisqualified}
                    className="w-full h-12 text-lg bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Round 2
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
