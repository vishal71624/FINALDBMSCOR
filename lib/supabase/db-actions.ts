"use server"

import { createClient } from "./server"
import type { Player, Question, SQLChallenge, TableData, TestCase } from "../game-store"

// ============ ROUND 1 QUESTIONS ============

interface DbRound1Question {
  id: number
  type: string
  difficulty: string
  question: string
  scenario: string | null
  options: string[]
  correct_answer: number
  points: number
  is_active: boolean
}

function dbToQuestion(row: DbRound1Question): Question {
  return {
    id: row.id,
    type: row.type as 'mcq' | 'scenario',
    difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
    question: row.question,
    scenario: row.scenario || undefined,
    options: row.options,
    correctAnswer: row.correct_answer,
    points: row.points,
  }
}

function questionToDb(q: Omit<Question, 'id'>) {
  return {
    type: q.type,
    difficulty: q.difficulty,
    question: q.question,
    scenario: q.scenario || null,
    options: q.options,
    correct_answer: q.correctAnswer,
    points: q.points,
    is_active: true,
  }
}

export async function fetchRound1Questions(): Promise<Question[]> {
  try {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("round1_questions")
    .select("*")
    .eq("is_active", true)
    .order("difficulty", { ascending: true })
    .order("id", { ascending: true })

  if (error) {
    console.error("Error fetching round1 questions:", error)
    return []
  }

  return (data || []).map(dbToQuestion)
  } catch (e) {
    console.error("fetchRound1Questions error:", e)
    return []
  }
}

export async function createRound1Question(question: Omit<Question, 'id'>): Promise<Question | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("round1_questions")
    .insert(questionToDb(question))
    .select()
    .single()

  if (error) {
    console.error("Error creating round1 question:", error)
    return null
  }

  return dbToQuestion(data)
}

export async function updateRound1Question(id: number, question: Partial<Omit<Question, 'id'>>): Promise<Question | null> {
  const supabase = await createClient()
  
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (question.type !== undefined) updateData.type = question.type
  if (question.difficulty !== undefined) updateData.difficulty = question.difficulty
  if (question.question !== undefined) updateData.question = question.question
  if (question.scenario !== undefined) updateData.scenario = question.scenario || null
  if (question.options !== undefined) updateData.options = question.options
  if (question.correctAnswer !== undefined) updateData.correct_answer = question.correctAnswer
  if (question.points !== undefined) updateData.points = question.points

  const { data, error } = await supabase
    .from("round1_questions")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating round1 question:", error)
    return null
  }

  return dbToQuestion(data)
}

export async function deleteRound1Question(id: number): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("round1_questions")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting round1 question:", error)
    return false
  }

  return true
}

// ============ ROUND 2 CHALLENGES ============

interface DbRound2Challenge {
  id: number
  difficulty: string
  title: string
  description: string
  scenario: string | null
  schema: string | null
  base_table_data: TableData[]
  test_cases: TestCase[]
  expected_keywords: string[]
  total_points: number
  time_limit: number
  is_active: boolean
}

function normalizeTableData(td: TableData): TableData {
  return {
    tableName: td?.tableName || '',
    columns: td?.columns || [],
    rows: td?.rows || [],
  }
}

function normalizeTestCase(tc: TestCase): TestCase {
  return {
    ...tc,
    tableData: (tc?.tableData || []).map(normalizeTableData),
    expectedOutput: tc?.expectedOutput || [],
    expectedColumns: tc?.expectedColumns || [],
  }
}

function dbToChallenge(row: DbRound2Challenge): SQLChallenge {
  return {
    id: row.id,
    difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
    title: row.title,
    description: row.description,
    scenario: row.scenario || '',
    schema: row.schema || '',
    baseTableData: (row.base_table_data || []).map(normalizeTableData),
    testCases: (row.test_cases || []).map(normalizeTestCase),
    expectedKeywords: row.expected_keywords || [],
    totalPoints: row.total_points,
    timeLimit: row.time_limit,
  }
}

function challengeToDb(c: Omit<SQLChallenge, 'id'>) {
  return {
    difficulty: c.difficulty,
    title: c.title,
    description: c.description,
    scenario: c.scenario || null,
    schema: c.schema || null,
    base_table_data: c.baseTableData,
    test_cases: c.testCases,
    expected_keywords: c.expectedKeywords,
    total_points: c.totalPoints,
    time_limit: c.timeLimit,
    is_active: true,
  }
}

export async function fetchRound2Challenges(): Promise<SQLChallenge[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("round2_challenges")
      .select("*")
      .eq("is_active", true)
      .order("difficulty", { ascending: true })
      .order("id", { ascending: true })

    if (error) {
      console.error("Error fetching round2 challenges:", error)
      return []
    }

    return (data || []).map(dbToChallenge)
  } catch (e) {
    console.error("fetchRound2Challenges error:", e)
    return []
  }
}

export async function createRound2Challenge(challenge: Omit<SQLChallenge, 'id'>): Promise<SQLChallenge | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("round2_challenges")
    .insert(challengeToDb(challenge))
    .select()
    .single()

  if (error) {
    console.error("Error creating round2 challenge:", error)
    return null
  }

  return dbToChallenge(data)
}

export async function updateRound2Challenge(id: number, challenge: Partial<Omit<SQLChallenge, 'id'>>): Promise<SQLChallenge | null> {
  const supabase = await createClient()
  
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (challenge.difficulty !== undefined) updateData.difficulty = challenge.difficulty
  if (challenge.title !== undefined) updateData.title = challenge.title
  if (challenge.description !== undefined) updateData.description = challenge.description
  if (challenge.scenario !== undefined) updateData.scenario = challenge.scenario || null
  if (challenge.schema !== undefined) updateData.schema = challenge.schema || null
  if (challenge.baseTableData !== undefined) updateData.base_table_data = challenge.baseTableData
  if (challenge.testCases !== undefined) updateData.test_cases = challenge.testCases
  if (challenge.expectedKeywords !== undefined) updateData.expected_keywords = challenge.expectedKeywords
  if (challenge.totalPoints !== undefined) updateData.total_points = challenge.totalPoints
  if (challenge.timeLimit !== undefined) updateData.time_limit = challenge.timeLimit

  const { data, error } = await supabase
    .from("round2_challenges")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating round2 challenge:", error)
    return null
  }

  return dbToChallenge(data)
}

export async function deleteRound2Challenge(id: number): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("round2_challenges")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting round2 challenge:", error)
    return false
  }

  return true
}

// Convert database row to Player type
function rowToPlayer(row: {
  id: string
  name: string
  college?: string | null
  department?: string | null
  year_of_study?: string | null
  contact_number?: string | null
  email?: string | null
  score: number
  round1_score: number
  round2_score: number
  round1_completed: boolean
  round2_enabled: boolean
  round2_completed: boolean
  tab_switch_count: number
  is_disqualified: boolean
  round1_answers: Record<number, number> | null
  start_time: number | null
}): Player {
  return {
    id: row.id,
    name: row.name,
    score: row.score,
    round1Score: row.round1_score,
    round2Score: row.round2_score,
    round1Completed: row.round1_completed,
    round2Enabled: row.round2_enabled,
    round2Completed: row.round2_completed,
    tabSwitchCount: row.tab_switch_count,
    isDisqualified: row.is_disqualified,
    round1Answers: row.round1_answers || {},
    startTime: row.start_time ?? undefined,
    college: row.college ?? '',
    department: row.department ?? '',
    yearOfStudy: row.year_of_study ?? '',
    contactNumber: row.contact_number ?? '',
    email: row.email ?? '',
  }
}

// Convert Player to database row format
function playerToRow(player: Player) {
  return {
    id: player.id,
    name: player.name,
    college: player.college || null,
    department: player.department || null,
    year_of_study: player.yearOfStudy || null,
    contact_number: player.contactNumber || null,
    email: player.email || null,
    score: player.score,
    round1_score: player.round1Score,
    round2_score: player.round2Score,
    round1_completed: player.round1Completed,
    round2_enabled: player.round2Enabled,
    round2_completed: player.round2Completed,
    tab_switch_count: player.tabSwitchCount,
    is_disqualified: player.isDisqualified,
    round1_answers: player.round1Answers,
    start_time: player.startTime ?? null,
  }
}

export async function fetchAllPlayers(): Promise<Player[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("score", { ascending: false })

    if (error) {
      console.error("Error fetching players:", error)
      return []
    }

    return (data || []).map(rowToPlayer)
  } catch (e) {
    console.error("fetchAllPlayers error:", e)
    return []
  }
}

export async function fetchPlayerById(id: string): Promise<Player | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching player:", error)
      return null
    }

    return rowToPlayer(data)
  } catch (e) {
    console.error("fetchPlayerById error:", e)
    return null
  }
}

export async function createPlayer(
  code: string,
  studentDetails?: {
    name?: string
    college?: string
    department?: string
    yearOfStudy?: string
    contactNumber?: string
    email?: string
  }
): Promise<Player | null> {
  const supabase = await createClient()
  const normalizedCode = code.toUpperCase().trim()

  const newPlayer: Player = {
    id: normalizedCode,
    name: studentDetails?.name || normalizedCode,
    score: 0,
    round1Score: 0,
    round2Score: 0,
    round1Completed: false,
    round2Enabled: false,
    round2Completed: false,
    tabSwitchCount: 0,
    isDisqualified: false,
    round1Answers: {},
    college: studentDetails?.college || '',
    department: studentDetails?.department || '',
    yearOfStudy: studentDetails?.yearOfStudy || '',
    contactNumber: studentDetails?.contactNumber || '',
    email: studentDetails?.email || '',
  }

  const { data, error } = await supabase
    .from("players")
    .insert(playerToRow(newPlayer))
    .select()
    .single()

  if (error) {
    console.error("Error creating player:", error)
    return null
  }

  return rowToPlayer(data)
}

export async function updatePlayer(player: Player): Promise<Player | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("players")
    .update({
      ...playerToRow(player),
      updated_at: new Date().toISOString(),
    })
    .eq("id", player.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating player:", error)
    return null
  }

  return rowToPlayer(data)
}

export async function deletePlayer(id: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting player:", error)
    return false
  }

  return true
}

export async function enableRound2ForPlayer(playerId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("players")
    .update({ round2_enabled: true, updated_at: new Date().toISOString() })
    .eq("id", playerId)

  if (error) {
    console.error("Error enabling round 2:", error)
    return false
  }

  return true
}

export async function disableRound2ForPlayer(playerId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("players")
    .update({ round2_enabled: false, updated_at: new Date().toISOString() })
    .eq("id", playerId)

  if (error) {
    console.error("Error disabling round 2:", error)
    return false
  }

  return true
}

export async function resetAllPlayers(): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("players")
    .update({
      score: 0,
      round1_score: 0,
      round2_score: 0,
      round1_completed: false,
      round2_enabled: false,
      round2_completed: false,
      tab_switch_count: 0,
      is_disqualified: false,
      round1_answers: {},
      start_time: null,
      updated_at: new Date().toISOString(),
    })
    .neq("id", "") // Update all rows

  if (error) {
    console.error("Error resetting players:", error)
    return false
  }

  return true
}

export async function getLeaderboard(): Promise<Player[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("is_disqualified", false)
    .order("score", { ascending: false })

  if (error) {
    console.error("Error fetching leaderboard:", error)
    return []
  }

  return (data || []).map(rowToPlayer)
}
