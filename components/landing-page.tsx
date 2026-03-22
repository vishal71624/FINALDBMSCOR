'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/lib/game-store'
import { Database, Terminal } from 'lucide-react'

export function LandingPage() {
  const setView = useGameStore((s) => s.setView)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.08)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)]" />
      
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[100px] animate-pulse" />

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-center p-6 lg:px-12">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            <span className="font-mono text-lg font-bold tracking-tight text-foreground">ITRIX 2026</span>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
<h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-12">
            <span className="text-foreground">COMMIT</span>
            <span className="text-muted-foreground mx-4">or</span>
            <span className="text-primary">ROLLBACK</span>
          </h1>

          <Button 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-7 text-xl font-semibold"
            onClick={() => setView('login')}
          >
            <Terminal className="w-6 h-6 mr-3" />
            Enter Challenge
          </Button>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center text-sm text-muted-foreground">
          <p>Department of Information Science and Technology, CEG, Anna University</p>
        </footer>
      </div>
    </div>
  )
}
