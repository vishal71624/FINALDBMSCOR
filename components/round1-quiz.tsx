'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '@/lib/game-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Maximize,
  Database,
  Shield,
  ChevronLeft,
  ChevronRight,
  Send
} from 'lucide-react'

export function Round1Quiz() {
  const {
    currentPlayer,
    currentQuestionIndex,
    timeRemaining,
    round1Questions,
    tabSwitchCount,
    maxTabSwitches,
    saveAnswer,
    goToQuestion,
    submitRound1,
    recordTabSwitch,
    setFullscreen,
    updateTimer,
    setView,
    addViolation
  } = useGameStore()

  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  const currentQuestion = round1Questions[currentQuestionIndex]
  const selectedAnswer = currentPlayer?.round1Answers[currentQuestion?.id]
  const answeredCount = Object.keys(currentPlayer?.round1Answers || {}).length

  // Timer
  useEffect(() => {
    if (showFullscreenPrompt) return

    const timer = setInterval(() => {
      if (timeRemaining <= 1) {
        submitRound1()
        clearInterval(timer)
      } else {
        updateTimer(timeRemaining - 1)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, showFullscreenPrompt, updateTimer, submitRound1])

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !showFullscreenPrompt) {
        const canContinue = recordTabSwitch()
        if (!canContinue) {
          setView('dashboard')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [showFullscreenPrompt, recordTabSwitch, setView])

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement
      setFullscreen(isFS)
      if (!isFS && !showFullscreenPrompt) {
        setShowFullscreenPrompt(true)
        addViolation('Exited fullscreen mode')
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [showFullscreenPrompt, setFullscreen, addViolation])

  // Block copy/paste
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      addViolation('Copy attempt blocked')
    }
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault()
      addViolation('Paste attempt blocked')
    }
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [addViolation])

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
      setShowFullscreenPrompt(false)
    } catch {
      setShowFullscreenPrompt(false)
    }
  }, [])

  const handleSelectAnswer = (answerIndex: number) => {
    if (currentQuestion) {
      saveAnswer(currentQuestion.id, answerIndex)
    }
  }

  const handleSubmit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
    submitRound1()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-neon-green border-neon-green/50 bg-neon-green/10'
      case 'medium': return 'text-neon-orange border-neon-orange/50 bg-neon-orange/10'
      case 'hard': return 'text-neon-red border-neon-red/50 bg-neon-red/10'
      default: return 'text-primary border-primary/50'
    }
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">No questions available</p>
      </div>
    )
  }

  // Fullscreen prompt
  if (showFullscreenPrompt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-primary/30 bg-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-foreground">Proctored Environment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Maximize className="w-4 h-4 text-primary" />
                Fullscreen mode will be enabled
              </p>
              <p className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-neon-orange" />
                Tab switches are monitored ({maxTabSwitches} max)
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neon-cyan" />
                45 minutes for 30 questions
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neon-green" />
                You can navigate between questions freely
              </p>
            </div>

            <Button 
              onClick={enterFullscreen}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Maximize className="w-4 h-4 mr-2" />
              Enter Fullscreen & Start
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => setView('dashboard')}
              className="w-full text-muted-foreground"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background select-none flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50 shrink-0">
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Round 1</p>
              <p className="text-xs text-muted-foreground">
                {answeredCount} of {round1Questions.length} answered
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              tabSwitchCount >= 2 ? 'bg-destructive/20 text-destructive' : 'bg-muted text-foreground'
            }`}>
              <AlertTriangle className="w-4 h-4" />
              {tabSwitchCount}/{maxTabSwitches}
            </div>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${
              timeRemaining <= 60 
                ? 'bg-destructive/20 text-destructive animate-pulse' 
                : timeRemaining <= 300 
                  ? 'bg-neon-orange/20 text-neon-orange'
                  : 'bg-primary/20 text-primary'
            }`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-6xl mx-auto w-full">
{/* Question Navigator - Sidebar */}
        <div className="lg:w-80 shrink-0">
          <Card className="border-border/50 bg-card/80 lg:sticky lg:top-20">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm text-foreground">Questions ({answeredCount}/{round1Questions.length})</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="grid grid-cols-10 sm:grid-cols-10 lg:grid-cols-10 gap-1">
                {round1Questions.map((q, index) => {
                  const isAnswered = currentPlayer?.round1Answers[q.id] !== undefined
                  const isCurrent = index === currentQuestionIndex
                  return (
                    <button
                      key={`q-${q.id}-${index}`}
                      onClick={() => goToQuestion(index)}
                      className={`w-6 h-6 rounded flex items-center justify-center font-medium text-[10px] transition-all ${
                        isCurrent
                          ? 'bg-primary text-primary-foreground ring-1 ring-primary ring-offset-1 ring-offset-background'
                          : isAnswered
                            ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-neon-green/20 border border-neon-green/50"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-muted"></div>
                  <span>Not answered</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Card */}
        <div className="flex-1 flex flex-col">
          <Card className="border-border/50 bg-card/80 flex-1">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">Q{currentQuestionIndex + 1}</span>
                  <Badge variant="outline" className={getDifficultyColor(currentQuestion.difficulty)}>
                    {currentQuestion.difficulty.toUpperCase()}
                  </Badge>
                </div>
                <Badge className="bg-primary/20 text-primary border-0">
                  {currentQuestion.points} pts
                </Badge>
              </div>

              {currentQuestion.scenario && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50 mb-4">
                  <p className="text-sm font-medium text-primary mb-2">Scenario:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentQuestion.scenario}
                  </p>
                </div>
              )}

              <CardTitle className="text-lg leading-relaxed text-foreground">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedAnswer === index
                      ? 'bg-primary/20 border-primary text-foreground'
                      : 'bg-muted/30 border-border/50 hover:border-primary/50 hover:bg-primary/5 text-foreground'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                      selectedAnswer === index
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1 text-sm">{option}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => goToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="border-border/50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentQuestionIndex < round1Questions.length - 1 ? (
                <Button
                  onClick={() => goToQuestion(currentQuestionIndex + 1)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="bg-neon-green text-background hover:bg-neon-green/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Round 1
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full border-primary/30 bg-card">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-foreground">Submit Round 1?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-muted-foreground">
                <p>You have answered {answeredCount} of {round1Questions.length} questions.</p>
                {answeredCount < round1Questions.length && (
                  <p className="text-neon-orange mt-2">
                    {round1Questions.length - answeredCount} questions are unanswered!
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1"
                >
                  Review Answers
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-neon-green text-background hover:bg-neon-green/90"
                >
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
