'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/lib/game-store'
import { LandingPage } from '@/components/landing-page'
import { LoginPage } from '@/components/login-page'
import { Dashboard } from '@/components/dashboard'
import { Round1Quiz } from '@/components/round1-quiz'
import { Round2Editor } from '@/components/round2-editor'
import { Leaderboard } from '@/components/leaderboard'
import { AdminPanel } from '@/components/admin-panel'

export default function Home() {
  const currentView = useGameStore((s) => s.currentView)
  const loadRound1Questions = useGameStore((s) => s.loadRound1Questions)
  const loadRound2Challenges = useGameStore((s) => s.loadRound2Challenges)

  // Load questions from database on app mount
  useEffect(() => {
    loadRound1Questions()
    loadRound2Challenges()
  }, [loadRound1Questions, loadRound2Challenges])

  switch (currentView) {
    case 'landing':
      return <LandingPage />
    case 'login':
      return <LoginPage />
    case 'dashboard':
      return <Dashboard />
    case 'round1':
      return <Round1Quiz />
    case 'round2':
      return <Round2Editor />
    case 'leaderboard':
      return <Leaderboard />
    case 'admin':
      return <AdminPanel />
    default:
      return <LandingPage />
  }
}
