'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGameStore, Question, SQLChallenge, TableData, TableColumn, TestCase, LeaderboardEntry } from '@/lib/game-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Shield, 
  Users, 
  Trophy,
  UserPlus, 
  Trash2, 
  RefreshCcw,
  Database,
  LogOut,
  Copy,
  Check,
  Zap,
  Ban,
  Unlock,
  Lock,
  CheckCircle2,
  Loader2,
  Search,
  Shuffle,
  GraduationCap,
  Building,
  Phone,
  Mail,
  BookOpen,
  Eye,
  Plus,
  Edit,
  FileQuestion,
  Table,
  Code,
  Play,
  Crown,
  Medal
} from 'lucide-react'

export function AdminPanel() {
  const { 
    players, 
    round1Questions,
    round2Challenges,
    logout, 
    setView,
    addPlayer,
    removePlayer,
    enableRound2,
    disableRound2,
    loadPlayers,
    loadRound1Questions,
    loadRound2Challenges,
    addRound1Question,
    updateRound1Question,
    deleteRound1Question,
    addRound2Challenge,
    updateRound2Challenge,
    deleteRound2Challenge
  } = useGameStore()

  const [generatedCode, setGeneratedCode] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [addedCount, setAddedCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Student details form state
  const [studentName, setStudentName] = useState('')
  const [studentCollege, setStudentCollege] = useState('')
  const [studentDepartment, setStudentDepartment] = useState('')
  const [studentYear, setStudentYear] = useState('')
  const [studentContact, setStudentContact] = useState('')
  const [studentEmail, setStudentEmail] = useState('')

  // Round 1 Question form state
  const [showR1QuestionDialog, setShowR1QuestionDialog] = useState(false)
  const [editingR1Question, setEditingR1Question] = useState<Question | null>(null)
  const [r1Question, setR1Question] = useState('')
  const [r1Scenario, setR1Scenario] = useState('')
  const [r1Difficulty, setR1Difficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [r1Options, setR1Options] = useState(['', '', '', ''])
  const [r1CorrectAnswer, setR1CorrectAnswer] = useState(0)
  const [r1Points, setR1Points] = useState(10)

  // Round 2 Challenge form state
  const [showR2ChallengeDialog, setShowR2ChallengeDialog] = useState(false)
  const [editingR2Challenge, setEditingR2Challenge] = useState<SQLChallenge | null>(null)
  
  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false)
  const [leaderboardAutoRefresh, setLeaderboardAutoRefresh] = useState(true)
  const [r2Title, setR2Title] = useState('')
  const [r2Description, setR2Description] = useState('')
  const [r2Scenario, setR2Scenario] = useState('')
  const [r2Schema, setR2Schema] = useState('')
  const [r2Difficulty, setR2Difficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [r2CorrectQuery, setR2CorrectQuery] = useState('')
  const [r2TableName, setR2TableName] = useState('')
  const [r2TableColumns, setR2TableColumns] = useState('')
  const [r2TableRows, setR2TableRows] = useState('')

  // Build leaderboard from players data
  const loadLeaderboardData = useCallback(() => {
    setIsLeaderboardLoading(true)
    try {
      const sortedPlayers = players
        .filter(p => !p.isDisqualified)
        .sort((a, b) => b.score - a.score)
        .map((player, index) => ({
          rank: index + 1,
          player,
          totalScore: player.score
        }))
      setLeaderboard(sortedPlayers)
    } finally {
      setIsLeaderboardLoading(false)
    }
  }, [players])

  // Load players and questions from database on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([
        loadPlayers(),
        loadRound1Questions(),
        loadRound2Challenges()
      ])
      setIsLoading(false)
    }
    loadData()
  }, [loadPlayers, loadRound1Questions, loadRound2Challenges])
  
  // Update leaderboard when players change
  useEffect(() => {
    loadLeaderboardData()
  }, [loadLeaderboardData])
  
  // Auto-refresh leaderboard every 10 seconds by reloading players
  useEffect(() => {
    if (!leaderboardAutoRefresh) return
    
    const interval = setInterval(async () => {
      try {
        await loadPlayers()
      } catch {
        // Silently handle fetch errors during auto-refresh
      }
    }, 10000) // 10 seconds
    
    return () => clearInterval(interval)
  }, [leaderboardAutoRefresh, loadPlayers])

  const disqualifiedPlayers = players.filter(p => p.isDisqualified).length
  const round1Completed = players.filter(p => p.round1Completed).length
  const round2Enabled = players.filter(p => p.round2Enabled).length

  // Filter players based on search
  const filteredPlayers = players.filter(p => 
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.college && p.college.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.department && p.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Generate a random unique student code
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'IST'
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    // Check if code already exists, regenerate if so
    const exists = players.find(p => p.id === code)
    if (exists) {
      return generateRandomCode() // Recursively generate new code if exists
    }
    setGeneratedCode(code)
    return code
  }

  const handleAddPlayer = () => {
    if (!generatedCode.trim()) {
      alert('Please generate a student code first!')
      return
    }
    const exists = players.find(p => p.id === generatedCode.toUpperCase().trim())
    if (exists) {
      alert('Player with this code already exists! Please generate a new code.')
      return
    }
    addPlayer(generatedCode.trim(), {
      name: studentName || generatedCode.trim(),
      college: studentCollege,
      department: studentDepartment,
      yearOfStudy: studentYear,
      contactNumber: studentContact,
      email: studentEmail,
    })
    // Reset form
    setGeneratedCode('')
    setStudentName('')
    setStudentCollege('')
    setStudentDepartment('')
    setStudentYear('')
    setStudentContact('')
    setStudentEmail('')
    setAddedCount(1)
    setTimeout(() => setAddedCount(0), 2000)
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRefreshPlayers = async () => {
    setIsLoading(true)
    await loadPlayers()
    setIsLoading(false)
  }

  // Round 1 Question handlers
  const resetR1Form = () => {
    setR1Question('')
    setR1Scenario('')
    setR1Difficulty('easy')
    setR1Options(['', '', '', ''])
    setR1CorrectAnswer(0)
    setR1Points(10)
    setEditingR1Question(null)
  }

  const handleEditR1Question = (question: Question) => {
    setEditingR1Question(question)
    setR1Question(question.question)
    setR1Scenario(question.scenario || '')
    setR1Difficulty(question.difficulty)
    setR1Options([...question.options])
    setR1CorrectAnswer(question.correctAnswer)
    setR1Points(question.points)
    setShowR1QuestionDialog(true)
  }

  const handleSaveR1Question = async () => {
    if (!r1Question.trim() || r1Options.some(o => !o.trim())) {
      alert('Please fill in the question and all options')
      return
    }

    const questionData = {
      type: r1Scenario ? 'scenario' as const : 'mcq' as const,
      difficulty: r1Difficulty,
      question: r1Question,
      scenario: r1Scenario || undefined,
      options: r1Options,
      correctAnswer: r1CorrectAnswer,
      points: r1Points
    }

    if (editingR1Question) {
      await updateRound1Question(editingR1Question.id, questionData)
    } else {
      await addRound1Question(questionData)
    }

    resetR1Form()
    setShowR1QuestionDialog(false)
  }

  // Round 2 Challenge handlers
  const resetR2Form = () => {
    setR2Title('')
    setR2Description('')
    setR2Scenario('')
    setR2Schema('')
    setR2Difficulty('easy')
    setR2CorrectQuery('')
    setR2TableName('')
    setR2TableColumns('')
    setR2TableRows('')
    setEditingR2Challenge(null)
  }

  const handleEditR2Challenge = (challenge: SQLChallenge) => {
    setEditingR2Challenge(challenge)
    setR2Title(challenge.title)
    setR2Description(challenge.description)
    setR2Scenario(challenge.scenario)
    setR2Schema(challenge.schema)
    setR2Difficulty(challenge.difficulty)
    setR2CorrectQuery('')
    if (challenge.baseTableData.length > 0) {
      const table = challenge.baseTableData[0]
      setR2TableName(table.tableName)
      setR2TableColumns(table.columns.map(c => `${c.name}:${c.type}${c.isPrimaryKey ? ':PK' : ''}${c.isForeignKey ? ':FK' : ''}`).join(', '))
      setR2TableRows(table.rows.map(row => row.join(', ')).join('\n'))
    }
    setShowR2ChallengeDialog(true)
  }

  const parseTableData = (): TableData[] => {
    if (!r2TableName || !r2TableColumns) return []
    
    const columns: TableColumn[] = r2TableColumns.split(',').map(col => {
      const parts = col.trim().split(':')
      return {
        name: parts[0],
        type: parts[1] || 'VARCHAR',
        isPrimaryKey: parts.includes('PK'),
        isForeignKey: parts.includes('FK')
      }
    })

    const rows = r2TableRows.split('\n').filter(r => r.trim()).map(row => 
      row.split(',').map(cell => {
        const trimmed = cell.trim()
        if (trimmed === 'NULL' || trimmed === 'null') return null
        const num = Number(trimmed)
        return isNaN(num) ? trimmed : num
      })
    )

    return [{
      tableName: r2TableName,
      columns,
      rows
    }]
  }

  const handleSaveR2Challenge = async () => {
    if (!r2Title.trim() || !r2Description.trim() || !r2CorrectQuery.trim()) {
      alert('Please fill in the title, description, and correct query')
      return
    }

    const tableData = parseTableData()
    
    // Create test cases from the correct query execution
    const testCases: TestCase[] = [
      {
        id: 1,
        name: 'Sample Test',
        description: 'Basic test case',
        tableData: tableData,
        expectedOutput: [], // Would be populated by running the correct query
        expectedColumns: [],
        isHidden: false,
        points: 5
      },
      {
        id: 2,
        name: 'Edge Case',
        tableData: tableData,
        expectedOutput: [],
        expectedColumns: [],
        isHidden: true,
        points: 10
      }
    ]

    const challengeData: Omit<SQLChallenge, 'id'> = {
      difficulty: r2Difficulty,
      title: r2Title,
      description: r2Description,
      scenario: r2Scenario,
      schema: r2Schema,
      baseTableData: tableData,
      testCases: testCases,
      expectedKeywords: r2CorrectQuery.toLowerCase().split(/\s+/).filter(w => ['select', 'from', 'where', 'join', 'group', 'order', 'having'].includes(w)),
      totalPoints: 15,
      timeLimit: 180,
      correctQuery: r2CorrectQuery.trim()
    }

    if (editingR2Challenge) {
      await updateRound2Challenge(editingR2Challenge.id, challengeData)
    } else {
      await addRound2Challenge(challengeData)
    }

    resetR2Form()
    setShowR2ChallengeDialog(false)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-neon-green border-neon-green/50 bg-neon-green/10'
      case 'medium': return 'text-neon-orange border-neon-orange/50 bg-neon-orange/10'
      case 'hard': return 'text-neon-red border-neon-red/50 bg-neon-red/10'
      default: return 'text-primary border-primary/50'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-bold text-lg text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">ITRIX 2026</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50 bg-card/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Players</p>
                  <p className="text-3xl font-bold text-primary">{players.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">R1 Completed</p>
                  <p className="text-3xl font-bold text-neon-green">{round1Completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-neon-green/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">R2 Enabled</p>
                  <p className="text-3xl font-bold text-accent">{round2Enabled}</p>
                </div>
                <Unlock className="w-8 h-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disqualified</p>
                  <p className="text-3xl font-bold text-destructive">{disqualifiedPlayers}</p>
                </div>
                <Ban className="w-8 h-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="players" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="add" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Students
            </TabsTrigger>
            <TabsTrigger value="round1" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileQuestion className="w-4 h-4 mr-2" />
              Round 1 Questions
            </TabsTrigger>
            <TabsTrigger value="round2" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Code className="w-4 h-4 mr-2" />
              Round 2 Challenges
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Student Management</CardTitle>
                    <CardDescription>Manage students and enable Round 2 access</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64 bg-input border-border"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshPlayers}
                      disabled={isLoading}
                      className="border-primary/50 text-primary"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading students...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50 text-left text-sm text-muted-foreground">
                          <th className="pb-3 font-medium">Student</th>
<th className="pb-3 font-medium">College / Dept</th>
                        <th className="pb-3 font-medium">Phone</th>
                        <th className="pb-3 font-medium text-center">Scores</th>
                          <th className="pb-3 font-medium text-center">Status</th>
                          <th className="pb-3 font-medium text-center">R2 Access</th>
                          <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {filteredPlayers.map((player) => (
                          <tr key={player.id} className="hover:bg-muted/20">
                            <td className="py-3">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <code className="px-2 py-0.5 rounded bg-muted font-mono text-xs text-foreground">
                                    {player.id}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(player.id, player.id)}
                                  >
                                    {copiedId === player.id ? (
                                      <Check className="w-3 h-3 text-neon-green" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </Button>
                                </div>
                                <span className="text-sm font-medium text-foreground">{player.name !== player.id ? player.name : ''}</span>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm text-foreground flex items-center gap-1">
                                  <Building className="w-3 h-3 text-accent" />
                                  {player.college || '-'}
                                </span>
                                <span className="text-xs text-muted-foreground">{player.department || '-'}</span>
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm text-foreground">{player.contactNumber || '-'}</span>
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-primary">R1: {player.round1Score}</span>
                                  <span className="text-muted-foreground">|</span>
                                  <span className="text-accent">R2: {player.round2Score}</span>
                                </div>
                                <span className="font-bold text-foreground">Total: {player.score}</span>
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              {player.isDisqualified ? (
                                <Badge variant="destructive" className="bg-destructive/20 text-destructive border-0">DQ</Badge>
                              ) : player.round1Completed ? (
                                <Badge className="bg-neon-green/20 text-neon-green border-0">R1 Done</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">Pending</Badge>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              {player.round2Enabled ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => disableRound2(player.id)}
                                  className="border-neon-green/50 text-neon-green hover:bg-neon-green/10"
                                >
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Enabled
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => enableRound2(player.id)}
                                  disabled={!player.round1Completed}
                                  className="border-muted-foreground/30 text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
                                >
                                  <Lock className="w-3 h-3 mr-1" />
                                  Locked
                                </Button>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => removePlayer(player.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredPlayers.length === 0 && players.length > 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No students match your search</p>
                      </div>
                    )}

                    {players.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No students registered yet</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Student Tab */}
          <TabsContent value="add">
            <Card className="border-border/50 bg-card/80 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Add Student
                </CardTitle>
                <CardDescription>Register a student with auto-generated unique code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Generated Code Section */}
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                  <Label className="text-sm text-muted-foreground mb-2 block">Student Access Code</Label>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 px-4 py-3 rounded bg-muted font-mono text-lg text-foreground tracking-wider text-center">
                      {generatedCode || 'Click to generate'}
                    </code>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={generateRandomCode}
                      className="border-primary/50 text-primary hover:bg-primary/10"
                    >
                      <Shuffle className="w-4 h-4 mr-2" />
                      Generate
                    </Button>
                    {generatedCode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(generatedCode, 'generated')}
                      >
                        {copiedId === 'generated' ? (
                          <Check className="w-4 h-4 text-neon-green" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">This code will be used by the student to login. Share it securely.</p>
                </div>

                {/* Student Details */}
                <div className="space-y-2">
                  <Label htmlFor="student-name">Full Name *</Label>
                  <Input
                    id="student-name"
                    placeholder=""
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-college">College</Label>
                    <Input
                      id="student-college"
                      placeholder=""
                      value={studentCollege}
                      onChange={(e) => setStudentCollege(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-dept">Department</Label>
                    <Input
                      id="student-dept"
                      placeholder=""
                      value={studentDepartment}
                      onChange={(e) => setStudentDepartment(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-year">Year</Label>
                    <Input
                      id="student-year"
                      placeholder=""
                      value={studentYear}
                      onChange={(e) => setStudentYear(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-contact">Contact</Label>
                    <Input
                      id="student-contact"
                      placeholder=""
                      value={studentContact}
                      onChange={(e) => setStudentContact(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-email">Email</Label>
                    <Input
                      id="student-email"
                      placeholder=""
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleAddPlayer}
                  disabled={!generatedCode.trim() || !studentName.trim()}
                  className="w-full bg-primary text-primary-foreground"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>

                {addedCount === 1 && (
                  <div className="flex items-center gap-2 text-neon-green text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Student added successfully!
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Round 1 Questions Tab */}
          <TabsContent value="round1">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Round 1 Questions</CardTitle>
                    <CardDescription>Manage MCQ and scenario-based questions ({round1Questions.length} questions)</CardDescription>
                  </div>
                  <Dialog open={showR1QuestionDialog} onOpenChange={(open) => { setShowR1QuestionDialog(open); if (!open) resetR1Form(); }}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary text-primary-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingR1Question ? 'Edit Question' : 'Add New Question'}</DialogTitle>
                        <DialogDescription>Create an MCQ or scenario-based question</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <Select value={r1Difficulty} onValueChange={(v: 'easy' | 'medium' | 'hard') => setR1Difficulty(v)}>
                              <SelectTrigger className="bg-input border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="easy">Easy (10 pts)</SelectItem>
                                <SelectItem value="medium">Medium (15 pts)</SelectItem>
                                <SelectItem value="hard">Hard (20 pts)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Points</Label>
                            <Input
                              type="number"
                              value={r1Points}
                              onChange={(e) => setR1Points(parseInt(e.target.value) || 10)}
                              className="bg-input border-border"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Scenario (optional - makes it a scenario question)</Label>
                          <Textarea
                            placeholder="Describe a real-world scenario..."
                            value={r1Scenario}
                            onChange={(e) => setR1Scenario(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Question *</Label>
                          <Textarea
                            placeholder="Enter the question..."
                            value={r1Question}
                            onChange={(e) => setR1Question(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label>Options *</Label>
                          {r1Options.map((option, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant={r1CorrectAnswer === idx ? "default" : "outline"}
                                size="sm"
                                className={r1CorrectAnswer === idx ? "bg-neon-green text-background" : ""}
                                onClick={() => setR1CorrectAnswer(idx)}
                              >
                                {String.fromCharCode(65 + idx)}
                              </Button>
                              <Input
                                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...r1Options]
                                  newOptions[idx] = e.target.value
                                  setR1Options(newOptions)
                                }}
                                className="flex-1 bg-input border-border"
                              />
                              {r1CorrectAnswer === idx && (
                                <Badge className="bg-neon-green/20 text-neon-green border-0">Correct</Badge>
                              )}
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground">Click the letter button to mark as correct answer</p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => { setShowR1QuestionDialog(false); resetR1Form(); }}>Cancel</Button>
                        <Button onClick={handleSaveR1Question} className="bg-neon-green text-background hover:bg-neon-green/90">
                          {editingR1Question ? 'Update Question' : 'Add Question'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {round1Questions.map((q, idx) => (
                    <div key={`q-${q.id}-${q.difficulty}`} className="p-4 rounded-lg border border-border/50 hover:border-border/80 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Q{idx + 1}</span>
                            <Badge variant="outline" className={getDifficultyColor(q.difficulty)}>
                              {q.difficulty}
                            </Badge>
                            <Badge variant="outline">{q.points} pts</Badge>
                            {q.scenario && <Badge variant="outline" className="text-accent border-accent/50">Scenario</Badge>}
                          </div>
                          {q.scenario && (
                            <p className="text-sm text-muted-foreground mb-2 italic">{q.scenario}</p>
                          )}
                          <p className="text-sm text-foreground">{q.question}</p>
                          <div className="mt-2 grid grid-cols-2 gap-1">
                            {q.options.map((opt, optIdx) => (
                              <p key={optIdx} className={`text-xs ${optIdx === q.correctAnswer ? 'text-neon-green font-medium' : 'text-muted-foreground'}`}>
                                {String.fromCharCode(65 + optIdx)}. {opt} {optIdx === q.correctAnswer && '(Correct)'}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={() => handleEditR1Question(q)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => deleteRound1Question(q.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Round 2 Challenges Tab */}
          <TabsContent value="round2">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Round 2 SQL Challenges</CardTitle>
                    <CardDescription>Manage SQL query challenges ({round2Challenges.length} challenges)</CardDescription>
                  </div>
                  <Dialog open={showR2ChallengeDialog} onOpenChange={(open) => { setShowR2ChallengeDialog(open); if (!open) resetR2Form(); }}>
                    <DialogTrigger asChild>
                      <Button className="bg-accent text-accent-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Challenge
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingR2Challenge ? 'Edit Challenge' : 'Add New Challenge'}</DialogTitle>
                        <DialogDescription>Create an SQL query challenge with test data</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                              placeholder="e.g., Find Top Customers"
                              value={r2Title}
                              onChange={(e) => setR2Title(e.target.value)}
                              className="bg-input border-border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <Select value={r2Difficulty} onValueChange={(v: 'easy' | 'medium' | 'hard') => setR2Difficulty(v)}>
                              <SelectTrigger className="bg-input border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Scenario</Label>
                          <Textarea
                            placeholder="Describe the business context..."
                            value={r2Scenario}
                            onChange={(e) => setR2Scenario(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Description / Task *</Label>
                          <Textarea
                            placeholder="What should the student do? e.g., Write a query to find all customers who spent more than 10000..."
                            value={r2Description}
                            onChange={(e) => setR2Description(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Schema Description</Label>
                          <Input
                            placeholder="e.g., customers (id, name, email, total_spent)"
                            value={r2Schema}
                            onChange={(e) => setR2Schema(e.target.value)}
                            className="bg-input border-border font-mono"
                          />
                        </div>

                        <div className="border-t border-border/50 pt-4">
                          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                            <Table className="w-4 h-4" />
                            Table Data
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label>Table Name</Label>
                              <Input
                                placeholder="e.g., customers"
                                value={r2TableName}
                                onChange={(e) => setR2TableName(e.target.value)}
                                className="bg-input border-border font-mono"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Columns (format: name:TYPE:PK/FK)</Label>
                              <Input
                                placeholder="e.g., id:INT:PK, name:VARCHAR, total:DECIMAL"
                                value={r2TableColumns}
                                onChange={(e) => setR2TableColumns(e.target.value)}
                                className="bg-input border-border font-mono"
                              />
                              <p className="text-xs text-muted-foreground">Separate columns with comma. Add :PK for primary key, :FK for foreign key</p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Sample Data (one row per line)</Label>
                              <Textarea
                                placeholder={"1, John, 15000\n2, Jane, 8000\n3, Bob, 22000"}
                                value={r2TableRows}
                                onChange={(e) => setR2TableRows(e.target.value)}
                                className="bg-input border-border font-mono min-h-24"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-border/50 pt-4">
                          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            Correct Query
                          </h4>
                          <div className="space-y-2">
                            <Label>Correct SQL Query *</Label>
                            <Textarea
                              placeholder="SELECT * FROM customers WHERE total_spent > 10000"
                              value={r2CorrectQuery}
                              onChange={(e) => setR2CorrectQuery(e.target.value)}
                              className="bg-input border-border font-mono min-h-20"
                            />
                            <p className="text-xs text-muted-foreground">This query will be executed against the test data to generate expected output</p>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => { setShowR2ChallengeDialog(false); resetR2Form(); }}>Cancel</Button>
                        <Button onClick={handleSaveR2Challenge} className="bg-neon-green text-background hover:bg-neon-green/90">
                          {editingR2Challenge ? 'Update Challenge' : 'Add Challenge'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {round2Challenges.map((c, idx) => (
                    <div key={`ch-${c.id}-${c.difficulty}`} className="p-4 rounded-lg border border-border/50 hover:border-border/80 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
                            <Badge variant="outline" className={getDifficultyColor(c.difficulty)}>
                              {c.difficulty}
                            </Badge>
                            <Badge variant="outline">{c.totalPoints} pts</Badge>
                            <Badge variant="outline" className="text-accent border-accent/50">
                              {c.testCases.length} test cases
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground">{c.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                          <p className="text-xs font-mono text-accent mt-2">{c.schema}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={() => handleEditR2Challenge(c)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => deleteRound2Challenge(c.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      Live Leaderboard
                    </CardTitle>
                    <CardDescription>
                      Real-time player rankings
                      {leaderboardAutoRefresh && (
                        <span className="ml-2 text-neon-green">• Auto-refreshing every 10s</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLeaderboardAutoRefresh(!leaderboardAutoRefresh)}
                      className={leaderboardAutoRefresh ? 'border-neon-green/50 text-neon-green' : 'border-muted-foreground/30 text-muted-foreground'}
                    >
                      {leaderboardAutoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadLeaderboardData}
                      disabled={isLeaderboardLoading}
                      className="border-primary/50 text-primary"
                    >
                      {isLeaderboardLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLeaderboardLoading && leaderboard.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading leaderboard...</span>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No players on the leaderboard yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <div 
                        key={entry.player.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                          index === 0 
                            ? 'border-yellow-500/50 bg-yellow-500/5' 
                            : index === 1 
                              ? 'border-gray-400/50 bg-gray-400/5'
                              : index === 2
                                ? 'border-amber-700/50 bg-amber-700/5'
                                : 'border-border/50 hover:border-border/80'
                        }`}
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
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {entry.player.college || '-'}
                            </span>
                            <span>• {entry.player.department || '-'}</span>
                            <span>• {entry.player.yearOfStudy || '-'}</span>
                          </div>
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

                        {/* Status */}
                        <div className="hidden sm:block">
                          {entry.player.round2Completed ? (
                            <Badge className="bg-neon-green/20 text-neon-green border-0">R2 Done</Badge>
                          ) : entry.player.round1Completed ? (
                            <Badge className="bg-primary/20 text-primary border-0">R1 Done</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">In Progress</Badge>
                          )}
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  )
}
