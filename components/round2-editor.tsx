'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGameStore, TableData, TestCase, TestCaseResult } from '@/lib/game-store'
import { runTestCasesWithEngine } from '@/lib/sql-executor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  ChevronLeft,
  Database,
  Shield,
  Zap,
  Play,
  Code,
  Trophy,
  Target,
  Table,
  Eye,
  EyeOff,
  Lock,
  FlaskConical,
  Send,
  Sparkles,
  Terminal,
  Rocket
} from 'lucide-react'

// Table Display Component
function DataTable({ tableData }: { tableData: TableData }) {
  const columns = tableData?.columns || []
  const rows = tableData?.rows || []
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <div className="bg-accent/10 px-3 py-2 border-b border-border/50">
        <span className="font-mono text-sm font-medium text-accent">{tableData?.tableName}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/30">
              {columns.map((col, idx) => (
                <th key={idx} className="px-3 py-2 text-left font-medium text-foreground border-b border-border/30">
                  <div className="flex items-center gap-1">
                    <span>{col.name}</span>
                    {col.isPrimaryKey && <span className="text-[10px] text-primary">(PK)</span>}
                    {col.isForeignKey && <span className="text-[10px] text-neon-orange">(FK)</span>}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">{col.type}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-muted/20 transition-colors">
                {(row || []).map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-3 py-1.5 border-b border-border/20 font-mono text-muted-foreground">
                    {cell === null ? <span className="italic text-muted-foreground/50">NULL</span> : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Output Table Component for test results
function OutputTable({ columns, rows, variant = 'default' }: { 
  columns: string[]
  rows: (string | number | null)[][]
  variant?: 'default' | 'expected' | 'actual' | 'correct' | 'wrong'
}) {
  const safeColumns = columns || []
  const safeRows = rows || []
  const borderColors = {
    default: 'border-border/50',
    expected: 'border-accent/50',
    actual: 'border-primary/50',
    correct: 'border-neon-green/50',
    wrong: 'border-destructive/50'
  }

  return (
    <div className={`rounded-lg border overflow-hidden ${borderColors[variant]}`}>
      <div className="overflow-x-auto max-h-[150px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0">
            <tr className="bg-muted/50">
              {safeColumns.map((col, idx) => (
                <th key={idx} className="px-3 py-2 text-left font-medium text-foreground border-b border-border/30">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeRows.length === 0 ? (
              <tr>
                <td colSpan={safeColumns.length} className="px-3 py-4 text-center text-muted-foreground italic">
                  No results
                </td>
              </tr>
            ) : (
              safeRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-muted/20 transition-colors">
                  {(row || []).map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-3 py-1.5 border-b border-border/20 font-mono text-muted-foreground">
                      {cell === null ? <span className="italic text-muted-foreground/50">NULL</span> : String(cell)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Test Case Card Component
function TestCaseCard({ 
  testCase, 
  result, 
  isActive, 
  onClick,
  showDetails
}: { 
  testCase: TestCase
  result?: TestCaseResult
  isActive: boolean
  onClick: () => void
  showDetails: boolean
}) {
  const getStatusIcon = () => {
    if (!result) return <FlaskConical className="w-4 h-4 text-muted-foreground" />
    if (result.passed) return <CheckCircle2 className="w-4 h-4 text-neon-green" />
    return <XCircle className="w-4 h-4 text-destructive" />
  }

  const getStatusBg = () => {
    if (!result) return 'bg-muted/30'
    if (result.passed) return 'bg-neon-green/10'
    return 'bg-destructive/10'
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isActive 
          ? 'border-accent bg-accent/10' 
          : 'border-border/50 hover:border-border'
      } ${getStatusBg()}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-foreground">
            {testCase.isHidden ? `Edge Case ${testCase.id}` : testCase.name}
          </span>
          {testCase.isHidden && <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
      </div>
      {showDetails && !testCase.isHidden && testCase.description && (
        <p className="text-xs text-muted-foreground mt-1">{testCase.description}</p>
      )}
    </button>
  )
}

// Type for storing answers per question
interface QuestionAnswer {
  code: string
  testResults: TestCaseResult[]
  submitted: boolean
}

export function Round2Editor() {
  const {
    currentPlayer,
    currentQuestionIndex,
    timeRemaining,
    round2Challenges,
    tabSwitchCount,
    maxTabSwitches,
    submitRound2Answer,
    runTestCases,
    goToQuestion,
    recordTabSwitch,
    setFullscreen,
    updateTimer,
    setView,
    addViolation,
    finishRound2
  } = useGameStore()

  // Store answers for each question
  const [answers, setAnswers] = useState<Record<number, QuestionAnswer>>({})
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTestCase, setActiveTestCase] = useState(0)
  const [activeTab, setActiveTab] = useState<'testcases' | 'result'>('testcases')
  const [showFinalSubmit, setShowFinalSubmit] = useState(false)
  const [finalResults, setFinalResults] = useState<{
    totalScore: number
    questionsAttempted: number
    totalQuestions: number
  } | null>(null)

  const safeChallenges = round2Challenges || []
  const currentChallenge = safeChallenges[currentQuestionIndex]
  const currentAnswer = answers[currentQuestionIndex] || { code: '', testResults: [], submitted: false }
  const progress = safeChallenges.length > 0 ? ((currentQuestionIndex + 1) / safeChallenges.length) * 100 : 0
  
  // Count answered questions
  const answeredCount = Object.values(answers).filter(a => a.code.trim()).length

  // Timer effect
  useEffect(() => {
    if (showFinalSubmit || showFullscreenPrompt || finalResults) return

    const timer = setInterval(() => {
      if (timeRemaining <= 1) {
        handleFinalSubmit()
        clearInterval(timer)
      } else {
        updateTimer(timeRemaining - 1)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, showFinalSubmit, showFullscreenPrompt, finalResults])

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
  }, [showFullscreenPrompt])

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
  }, [showFullscreenPrompt])

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
      setShowFullscreenPrompt(false)
    } catch {
      setShowFullscreenPrompt(false)
    }
  }, [])

  const updateCode = (newCode: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: {
        ...prev[currentQuestionIndex],
        code: newCode,
        testResults: [],
        submitted: false
      }
    }))
  }

  const handleRun = async () => {
    if (!currentAnswer.code.trim() || !currentChallenge) return
    
    setIsRunning(true)
    
    // Run test cases using PGlite engine
    const results = await runTestCasesWithEngine(currentAnswer.code, currentChallenge.testCases)
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: {
        ...prev[currentQuestionIndex],
        testResults: results
      }
    }))
    
    setActiveTab('result')
    setIsRunning(false)
  }

  const handleNavigate = (index: number) => {
    if (index >= 0 && index < safeChallenges.length) {
      setActiveTestCase(0)
      setActiveTab('testcases')
      goToQuestion(index)
    }
  }

  const handleFinalSubmit = async () => {
    // Submit all answers and calculate total score
    let totalScore = 0
    let questionsAttempted = 0
    
    for (let idx = 0; idx < safeChallenges.length; idx++) {
      const challenge = safeChallenges[idx]
      const answer = answers[idx]
      if (answer?.code.trim()) {
        questionsAttempted++
        // Run test cases using PGlite engine
        const testResults = await runTestCasesWithEngine(answer.code, challenge.testCases)
        
        // Calculate points based on test cases passed
        let pointsEarned = 0
        challenge.testCases.forEach((tc, tcIdx) => {
          if (testResults[tcIdx]?.passed) {
            pointsEarned += tc.points
          }
        })
        
        totalScore += pointsEarned
      }
    }
    
    // Update player score directly in store before finishing round 2
    // submitRound2Answer is deprecated since runTestCases is stubbed
    if (currentPlayer && totalScore > 0) {
      useGameStore.setState(s => {
        const updatedPlayer = {
          ...s.currentPlayer!,
          round2Score: s.currentPlayer!.round2Score + totalScore,
          score: s.currentPlayer!.score + totalScore
        }
        return {
          currentPlayer: updatedPlayer,
          players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
        }
      })
    }
    
    // Mark round 2 as completed and sync to database
    // This prevents the user from re-attending round 2
    await finishRound2()
    
    setFinalResults({
      totalScore,
      questionsAttempted,
      totalQuestions: safeChallenges.length
    })
    
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
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

  const safeTestCases = currentChallenge?.testCases || []
  const visibleTestCases = safeTestCases.filter(tc => !tc.isHidden)
  const hiddenTestCases = safeTestCases.filter(tc => tc.isHidden)
  const currentTestCase = safeTestCases[activeTestCase]

  if (!currentChallenge) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">No challenges available</p>
      </div>
    )
  }

  // Final Results Screen
  if (finalResults) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
        
        <Card className="max-w-lg w-full border-neon-green/30 bg-card relative z-10">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neon-green/20 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-neon-green" />
            </div>
            <CardTitle className="text-3xl text-foreground">Round 2 Complete!</CardTitle>
            <p className="text-muted-foreground mt-2">Great job completing the SQL Challenge Arena</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-6 rounded-lg bg-neon-green/10 border border-neon-green/30">
              <p className="text-sm text-muted-foreground mb-2">Your Final Score</p>
              <p className="text-5xl font-bold text-neon-green">{currentPlayer?.round2Score || finalResults.totalScore}</p>
              <p className="text-sm text-muted-foreground mt-2">points earned</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-2xl font-bold text-primary">{finalResults.questionsAttempted}</p>
                <p className="text-xs text-muted-foreground">Questions Attempted</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-2xl font-bold text-accent">{finalResults.totalQuestions}</p>
                <p className="text-xs text-muted-foreground">Total Questions</p>
              </div>
            </div>

            <Button 
              onClick={() => setView('dashboard')}
              className="w-full h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fullscreen prompt
  if (showFullscreenPrompt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
        
        <Card className="max-w-lg w-full border-accent/30 bg-card relative z-10">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
              <Terminal className="w-10 h-10 text-accent" />
            </div>
            <CardTitle className="text-3xl text-foreground">SQL Challenge Arena</CardTitle>
            <p className="text-muted-foreground mt-2">Prove your SQL mastery!</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-neon-green/10 border border-neon-green/30">
                <p className="text-2xl font-bold text-neon-green">5</p>
                <p className="text-xs text-muted-foreground">Easy</p>
              </div>
              <div className="p-4 rounded-lg bg-neon-orange/10 border border-neon-orange/30">
                <p className="text-2xl font-bold text-neon-orange">3</p>
                <p className="text-xs text-muted-foreground">Medium</p>
              </div>
              <div className="p-4 rounded-lg bg-neon-red/10 border border-neon-red/30">
                <p className="text-2xl font-bold text-neon-red">2</p>
                <p className="text-xs text-muted-foreground">Hard</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Navigate freely between all questions
              </p>
              <p className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-accent" />
                Test cases + hidden edge cases
              </p>
              <p className="flex items-center gap-2">
                <Target className="w-4 h-4 text-neon-orange" />
                Score revealed after final submission
              </p>
              <p className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-destructive" />
                Proctoring is active
              </p>
            </div>

            <Button 
              onClick={enterFullscreen}
              className="w-full h-14 text-lg bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Challenge
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => setView('dashboard')}
              className="w-full text-muted-foreground"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Submit Confirmation Modal
  if (showFinalSubmit) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full border-accent/30 bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-foreground">Submit All Answers?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground">
              <p>You have answered {answeredCount} of {safeChallenges.length} questions.</p>
              {answeredCount < safeChallenges.length && (
                <p className="text-neon-orange mt-2">
                  {safeChallenges.length - answeredCount} questions are unanswered!
                </p>
              )}
              <p className="text-sm mt-4 text-primary">
                Your score will be calculated and shown after submission.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFinalSubmit(false)}
                className="flex-1"
              >
                Review Answers
              </Button>
              <Button
                onClick={handleFinalSubmit}
                className="flex-1 bg-neon-green text-background hover:bg-neon-green/90"
              >
                Submit All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background select-none flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50 shrink-0">
        <div className="flex items-center justify-between px-4 py-3 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-accent" />
              <div>
                <p className="font-semibold text-foreground">Challenge {currentQuestionIndex + 1}/{safeChallenges.length}</p>
                <p className="text-xs text-muted-foreground">{currentChallenge.title}</p>
              </div>
            </div>
            
            <Badge variant="outline" className={getDifficultyColor(currentChallenge.difficulty)}>
              {currentChallenge.difficulty.toUpperCase()}
            </Badge>
            
            <Badge className="bg-muted text-muted-foreground border-0">
              <FlaskConical className="w-3 h-3 mr-1" />
              {safeTestCases.length} tests
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-2">
              <p className="text-xs text-muted-foreground">Answered</p>
              <p className="font-bold text-primary">{answeredCount}/{safeChallenges.length}</p>
            </div>

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
                  : 'bg-accent/20 text-accent'
            }`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-1" />
      </header>

      {/* Main Content - LeetCode Style Layout */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Left Panel - Problem Description & Question Nav */}
        <div className="w-[420px] shrink-0 flex flex-col border-r border-border/50 overflow-hidden bg-card/30">
          {/* Question Navigator */}
          <div className="p-3 border-b border-border/50 bg-card/50">
            <p className="text-xs text-muted-foreground font-medium mb-2">Questions ({answeredCount}/{safeChallenges.length})</p>
            <div className="grid grid-cols-10 gap-1">
              {safeChallenges.map((q, index) => {
                const hasAnswer = answers[index]?.code.trim()
                const hasResults = answers[index]?.testResults.length > 0
                const isCurrent = index === currentQuestionIndex
                return (
                  <button
                    key={`c-${q.id}-${index}`}
                    onClick={() => handleNavigate(index)}
                    className={`w-6 h-6 rounded flex items-center justify-center font-medium text-[10px] transition-all ${
                      isCurrent
                        ? 'bg-accent text-accent-foreground ring-1 ring-accent ring-offset-1 ring-offset-background'
                        : hasAnswer
                          ? hasResults 
                            ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                            : 'bg-primary/20 text-primary border border-primary/50'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-neon-green/50"></div>
                <span>Tested</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-primary/50"></div>
                <span>Written</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded bg-muted"></div>
                <span>Empty</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* Problem Title & Description */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">{currentChallenge.title}</h2>
              <p className="text-sm text-muted-foreground">{currentChallenge.scenario}</p>
            </div>

            {/* Mission */}
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <p className="text-xs font-medium text-primary mb-1">Your Mission:</p>
              <p className="text-sm text-foreground">{currentChallenge.description}</p>
            </div>

            {/* Schema */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">Schema:</p>
              <p className="text-sm font-mono text-accent">{currentChallenge.schema}</p>
            </div>

            {/* Table Structure */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">Sample Data</span>
              </div>
              {(currentChallenge.baseTableData || []).map((table, idx) => (
                <DataTable key={idx} tableData={table} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Code Editor & Test Cases */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Code Editor */}
          <div className="h-[40%] min-h-[200px] flex flex-col border-b border-border/50">
            <div className="flex items-center justify-between px-4 py-2 bg-card/50 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">SQL Query</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={handleRun}
                  disabled={isRunning || !currentAnswer.code.trim()}
                  className="border-neon-green/50 text-neon-green hover:bg-neon-green/10"
                >
                  <Play className="w-4 h-4 mr-1" />
                  {isRunning ? 'Running...' : 'Run Tests'}
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={currentAnswer.code}
                onChange={(e) => updateCode(e.target.value)}
                placeholder="-- Write your SQL query here...&#10;-- Your output will be compared with the expected result"
                className="w-full h-full p-3 rounded-lg bg-dark-blue border border-border/50 font-mono text-sm text-neon-cyan placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-accent/50"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Test Cases Panel */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'testcases' | 'result')} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-card/50 px-4 shrink-0">
                <TabsTrigger value="testcases" className="data-[state=active]:bg-accent/20">
                  <FlaskConical className="w-4 h-4 mr-2" />
                  Test Cases
                </TabsTrigger>
                <TabsTrigger value="result" className="data-[state=active]:bg-accent/20">
                  <Database className="w-4 h-4 mr-2" />
                  Results
                  {currentAnswer.testResults.length > 0 && (
                    <Badge className="ml-2 text-xs" variant="outline">
                      {currentAnswer.testResults.filter(r => r.passed).length}/{currentAnswer.testResults.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="testcases" className="flex-1 m-0 p-4 overflow-y-auto min-h-0">
                <div className="flex gap-4 h-full">
                  {/* Test Case List */}
                  <div className="w-64 shrink-0 space-y-2 overflow-y-auto pr-2">
                    <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-2">
                      <Eye className="w-3 h-3" />
                      Visible Tests ({visibleTestCases.length})
                    </p>
                    {visibleTestCases.map((tc) => (
                      <TestCaseCard
                        key={tc.id}
                        testCase={tc}
                        result={currentAnswer.testResults.find(r => r.testCaseId === tc.id)}
                        isActive={activeTestCase === safeTestCases.indexOf(tc)}
                        onClick={() => setActiveTestCase(safeTestCases.indexOf(tc))}
                        showDetails={true}
                      />
                    ))}
                    
                    {hiddenTestCases.length > 0 && (
                      <>
                        <p className="text-xs text-muted-foreground font-medium mt-4 mb-2 flex items-center gap-2">
                          <EyeOff className="w-3 h-3" />
                          Edge Cases ({hiddenTestCases.length})
                        </p>
                        {hiddenTestCases.map((tc) => (
                          <TestCaseCard
                            key={tc.id}
                            testCase={tc}
                            result={currentAnswer.testResults.find(r => r.testCaseId === tc.id)}
                            isActive={activeTestCase === safeTestCases.indexOf(tc)}
                            onClick={() => setActiveTestCase(safeTestCases.indexOf(tc))}
                            showDetails={false}
                          />
                        ))}
                      </>
                    )}
                  </div>

                  {/* Test Case Details */}
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {currentTestCase && !currentTestCase.isHidden ? (
                      <>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Input Data</p>
                          <div className="space-y-2">
                            {(currentTestCase?.tableData ?? []).map((table, idx) => (
                              <DataTable key={idx} tableData={table} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Expected Output</p>
                          <OutputTable 
                            columns={currentTestCase.expectedColumns}
                            rows={currentTestCase.expectedOutput}
                            variant="expected"
                          />
                        </div>
                      </>
                    ) : currentTestCase?.isHidden ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Lock className="w-12 h-12 mb-4 opacity-30" />
                        <p className="text-sm font-medium">Edge Case (Hidden)</p>
                        <p className="text-xs">Input and expected output are hidden for this test</p>
                        <p className="text-xs text-neon-orange mt-2">These carry more weightage!</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Select a test case to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="result" className="flex-1 m-0 p-4 overflow-y-auto min-h-0">
                {currentAnswer.testResults.length > 0 ? (
                  <div className="space-y-4">
                    {/* Run Results */}
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <FlaskConical className="w-5 h-5 text-accent" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Test Results</p>
                        <p className="text-xs text-muted-foreground">
                          {currentAnswer.testResults.filter(r => r.passed).length}/{currentAnswer.testResults.length} test cases passed
                        </p>
                      </div>
                      <Badge variant="outline" className={currentAnswer.testResults.every(r => r.passed) ? 'border-neon-green text-neon-green' : 'border-neon-orange text-neon-orange'}>
                        {currentAnswer.testResults.every(r => r.passed) ? 'All Passed' : 'Some Failed'}
                      </Badge>
                    </div>

                    {/* Test Results */}
                    <div className="space-y-3">
                      {visibleTestCases.map((tc) => {
                        const result = currentAnswer.testResults.find(r => r.testCaseId === tc.id)
                        if (!result) return null
                        return (
                          <Card key={tc.id} className={`border ${result.passed ? 'border-neon-green/50' : 'border-destructive/50'}`}>
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-3">
                                {result.passed ? (
                                  <CheckCircle2 className="w-4 h-4 text-neon-green" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-destructive" />
                                )}
                                <span className="text-sm font-medium">{tc.name}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Expected Output:</p>
                                  <OutputTable 
                                    columns={tc.expectedColumns}
                                    rows={tc.expectedOutput.slice(0, 5)}
                                    variant="expected"
                                  />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Your Output:</p>
                                  <OutputTable 
                                    columns={tc.expectedColumns}
                                    rows={result.actualOutput?.slice(0, 5) || []}
                                    variant={result.passed ? 'correct' : 'wrong'}
                                  />
                                </div>
                              </div>
                              {result.error && !result.passed && (
                                <p className="text-xs text-destructive mt-2">{result.error}</p>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                      
                      {/* Hidden test results summary */}
                      {hiddenTestCases.length > 0 && (
                        <Card className="border border-border/50">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Edge Cases</span>
                              <Badge variant="outline" className="ml-auto">
                                {currentAnswer.testResults.filter(r => hiddenTestCases.some(tc => tc.id === r.testCaseId) && r.passed).length}/{hiddenTestCases.length} passed
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Edge case details are hidden to test your solution robustness</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Database className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-sm">Run your query to see test results</p>
                    <p className="text-xs mt-1">Your output will be compared with expected results</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <footer className="border-t border-border/50 bg-card/50 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <Button
            variant="outline"
            onClick={() => handleNavigate(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
            className="border-border/50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentQuestionIndex < safeChallenges.length - 1 ? (
              <Button
                onClick={() => handleNavigate(currentQuestionIndex + 1)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : null}
            
            <Button
              onClick={() => setShowFinalSubmit(true)}
              className="bg-neon-green text-background hover:bg-neon-green/90"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit All
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
