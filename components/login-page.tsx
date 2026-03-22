'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGameStore } from '@/lib/game-store'
import { Database, ArrowLeft, AlertCircle, Lock } from 'lucide-react'

export function LoginPage() {
  const { setView, login } = useGameStore()
  const [playerCode, setPlayerCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handlePlayerLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!playerCode.trim()) {
      setError('Please enter your player code')
      return
    }

    setIsLoading(true)

    try {
      const success = await login(playerCode.toUpperCase())
      
      if (!success) {
        setError('Invalid player code')
        setIsLoading(false)
      }
      // If successful, don't set loading to false - let the navigation happen
    } catch {
      setError('Login failed. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.06)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-8 text-muted-foreground hover:text-foreground"
          onClick={() => setView('landing')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Database className="w-10 h-10 text-primary" />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">ITRIX 2026</h1>
            <p className="text-sm text-muted-foreground">IST, CEG, Anna University</p>
          </div>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-foreground">Player Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePlayerLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                  <Lock className="w-4 h-4 text-primary" />
                  Player Code
                </label>
                <Input
                  type="text"
                  placeholder="Enter your player code"
                  value={playerCode}
                  onChange={(e) => setPlayerCode(e.target.value)}
                  className="font-mono uppercase bg-input border-border focus:border-primary text-center text-lg tracking-wider"
                  autoComplete="off"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Enter Challenge'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
