import { create } from 'zustand'
import {
  fetchAllPlayers,
  fetchPlayerById,
  createPlayer as dbCreatePlayer,
  updatePlayer as dbUpdatePlayer,
  deletePlayer as dbDeletePlayer,
  enableRound2ForPlayer,
  disableRound2ForPlayer,
  resetAllPlayers,
  getLeaderboard as dbGetLeaderboard,
  // Question management
  fetchRound1Questions,
  createRound1Question as dbCreateRound1Question,
  updateRound1Question as dbUpdateRound1Question,
  deleteRound1Question as dbDeleteRound1Question,
  // Challenge management
  fetchRound2Challenges,
  createRound2Challenge as dbCreateRound2Challenge,
  updateRound2Challenge as dbUpdateRound2Challenge,
  deleteRound2Challenge as dbDeleteRound2Challenge,
} from './supabase/db-actions'

// Fisher-Yates shuffle algorithm for randomizing arrays
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Shuffle questions within each difficulty group (easy, medium, hard) then combine
function shuffleByDifficulty<T extends { difficulty: string }>(items: T[]): T[] {
  const easy = items.filter(q => q.difficulty === 'easy')
  const medium = items.filter(q => q.difficulty === 'medium')
  const hard = items.filter(q => q.difficulty === 'hard')
  
  return [
    ...shuffleArray(easy),
    ...shuffleArray(medium),
    ...shuffleArray(hard)
  ]
}

export type Difficulty = 'easy' | 'medium' | 'hard'
export type Round = 1 | 2
export type GameView = 'landing' | 'login' | 'dashboard' | 'round1' | 'round2' | 'leaderboard' | 'admin'

export interface Question {
  id: number
  type: 'mcq' | 'scenario'
  difficulty: Difficulty
  question: string
  scenario?: string
  options: string[]
  correctAnswer: number
  points: number
}

export interface TableColumn {
  name: string
  type: string
  isPrimaryKey?: boolean
  isForeignKey?: boolean
}

export interface TableData {
  tableName: string
  columns: TableColumn[]
  rows: (string | number | null)[][]
}

export interface TestCase {
  id: number
  name: string
  description?: string
  tableData: TableData[]
  expectedOutput: (string | number | null)[][]
  expectedColumns: string[]
  isHidden: boolean
  points: number
}

export interface TestCaseResult {
  testCaseId: number
  passed: boolean
  actualOutput: (string | number | null)[][] | null
  error?: string
}

export interface SQLChallenge {
  id: number
  difficulty: Difficulty
  title: string
  description: string
  scenario: string
  schema: string
  baseTableData: TableData[] // Base table shown to user
  testCases: TestCase[]
  expectedKeywords: string[]
  totalPoints: number
  timeLimit: number
}

export interface Player {
  id: string
  name: string
  score: number
  round1Score: number
  round2Score: number
  round1Completed: boolean
  round2Enabled: boolean
  round2Completed: boolean
  tabSwitchCount: number
  isDisqualified: boolean
  round1Answers: Record<number, number>
  startTime?: number
  // Student details
  college?: string
  department?: string
  yearOfStudy?: string
  contactNumber?: string
  email?: string
}

export interface LeaderboardEntry {
  rank: number
  player: Player
  totalScore: number
}

interface SubmissionResult {
  testResults: TestCaseResult[]
  totalPassed: number
  totalTests: number
  pointsEarned: number
  allPassed: boolean
}

interface GameState {
  currentView: GameView
  isFullscreen: boolean
  currentPlayer: Player | null
  players: Player[]
  currentRound: Round
  currentQuestionIndex: number
  timeRemaining: number
  isTimerRunning: boolean
  tabSwitchCount: number
  maxTabSwitches: number
  isProctoring: boolean
  violations: string[]
  round1Questions: Question[]
  round2Challenges: SQLChallenge[]
  isAdmin: boolean
  adminPassword: string

  setView: (view: GameView) => void
  login: (code: string) => Promise<boolean>
  adminLogin: (password: string) => boolean
  logout: () => void
  startRound1: () => void
  startRound2: () => void
  saveAnswer: (questionId: number, answer: number) => void
  submitRound1: () => Promise<void>
  submitRound2Answer: (code: string) => SubmissionResult
  runTestCases: (code: string) => TestCaseResult[]
  nextChallenge: () => void
  finishRound2: () => Promise<void>
  goToQuestion: (index: number) => void
  recordTabSwitch: () => boolean
  setFullscreen: (isFullscreen: boolean) => void
  updateTimer: (time: number) => void
  addViolation: (violation: string) => void
  updateLeaderboard: () => LeaderboardEntry[]
  addPlayer: (code: string, studentDetails?: { name?: string; college?: string; department?: string; yearOfStudy?: string; contactNumber?: string; email?: string }) => void
  removePlayer: (id: string) => void
  enableRound2: (playerId: string) => void
  disableRound2: (playerId: string) => void
  resetGame: () => void
  loadPlayers: () => Promise<void>
  syncPlayerToDb: (player: Player) => Promise<void>
  // Question management
  loadRound1Questions: () => Promise<void>
  addRound1Question: (question: Omit<Question, 'id'>) => Promise<void>
  updateRound1Question: (id: number, question: Partial<Question>) => Promise<void>
  deleteRound1Question: (id: number) => Promise<void>
  // Round 2 table and challenge management
  loadRound2Challenges: () => Promise<void>
  updateRound2Tables: (tables: TableData[]) => void
  addRound2Challenge: (challenge: Omit<SQLChallenge, 'id'>) => Promise<void>
  updateRound2Challenge: (id: number, challenge: Partial<SQLChallenge>) => Promise<void>
  deleteRound2Challenge: (id: number) => Promise<void>
}

// Round 1 Questions - 30 total: 15 Easy, 10 Medium, 5 Hard
// Easy = Very straightforward, Medium = Easy level, Hard = Medium level
const round1Questions: Question[] = [
  // EASY - 15 Questions (Very straightforward - basic SQL and DBMS concepts)
  {
    id: 1,
    type: 'mcq',
    difficulty: 'easy',
    question: 'What does SQL stand for?',
    options: [
      'Structured Query Language',
      'Simple Query Language',
      'Standard Query Language',
      'System Query Language'
    ],
    correctAnswer: 0,
    points: 10
  },
  {
    id: 2,
    type: 'mcq',
    difficulty: 'easy',
    question: 'Which SQL command is used to retrieve data from a database?',
    options: [
      'SELECT',
      'GET',
      'FETCH',
      'RETRIEVE'
    ],
    correctAnswer: 0,
    points: 10
  },
  {
    id: 3,
    type: 'mcq',
    difficulty: 'easy',
    question: 'Which SQL command is used to add new records to a table?',
    options: [
      'INSERT',
      'ADD',
      'CREATE',
      'APPEND'
    ],
    correctAnswer: 0,
    points: 10
  },
  {
    id: 4,
    type: 'mcq',
    difficulty: 'easy',
    question: 'Which SQL command is used to modify existing records?',
    options: [
      'UPDATE',
      'MODIFY',
      'CHANGE',
      'ALTER'
    ],
    correctAnswer: 0,
    points: 10
  },
  {
    id: 5,
    type: 'mcq',
    difficulty: 'easy',
    question: 'Which SQL command is used to remove records from a table?',
    options: [
      'DELETE',
      'REMOVE',
      'DROP',
      'ERASE'
    ],
    correctAnswer: 0,
    points: 10
  },
  {
    id: 6,
    type: 'mcq',
    difficulty: 'easy',
    question: 'What is a PRIMARY KEY in a database?',
    options: [
      'A unique identifier for each record in a table',
      'The first column in any table',
      'A password to access the database',
      'The most important data in a table'
    ],
    correctAnswer: 0,
    points: 10
  },
  {
    id: 7,
    type: 'mcq',
    difficulty: 'easy',
    question: 'Which clause is used to filter records in SQL?',
    options: [
      'WHERE',
      'FILTER',
      'HAVING',
      'IF'
    ],
    correctAnswer: 0,
    points: 10
  },
  {
    id: 8,
    type: 'mcq',
    difficulty: 'easy',
    question: 'Which clause is used to sort results in SQL?',
    options: [
      'ORDER BY',
      'SORT BY',
      'ARRANGE BY',
      'GROUP BY'
    ],
    correctAnswer: 0,
    points: 10
  },
  {
    id: 9,
    type: 'mcq',
    difficulty: 'easy',
    question: 'What does DBMS stand for?',
    options: [
      'Database Management System',
      'Data Backup Management System',
      'Digital Base Management System',
      'Database Maintenance System'
    ],
    correctAnswer: 0,
    points: 10
  },
  {
    id: 10,
    type: 'mcq',
    difficulty: 'easy',
    question: 'Which SQL command creates a new table?',
    options: [
      'CREATE TABLE',
      'NEW TABLE',
      'MAKE TABLE',
      'ADD TABLE'
    ],
    correctAnswer: 0,
    points: 10
  },
  {
    id: 11,
    type: 'mcq',
    difficulty: 'easy',
    question: 'Which SQL command deletes an entire table?',
    options: [
      'DROP TABLE',
      'DELETE TABLE',
      'REMOVE TABLE',
      'ERASE TABLE'
    ],
    correctAnswer: 0,
    points: 10
  },
  {
    id: 12,
    type: 'mcq',
    difficulty: 'easy',
    question: 'What symbol is used to select all columns in SQL?',
    options: [
      '* (asterisk)',
      '# (hash)',
      '@ (at)',
      '& (ampersand)'
    ],
    correctAnswer: 0,
    points: 10
  },
  {
    id: 13,
    type: 'mcq',
    difficulty: 'easy',
    question: 'Which keyword removes duplicate values from results?',
    options: [
      'DISTINCT',
      'UNIQUE',
      'DIFFERENT',
      'SINGLE'
    ],
    correctAnswer: 0,
    points: 10
  },
  {
    id: 14,
    type: 'mcq',
    difficulty: 'easy',
    question: 'What is a row in a database table also called?',
    options: [
      'Record or Tuple',
      'Column or Field',
      'Index or Key',
      'Schema or Structure'
    ],
    correctAnswer: 0,
    points: 10
  },
  {
    id: 15,
    type: 'mcq',
    difficulty: 'easy',
    question: 'What is a column in a database table also called?',
    options: [
      'Field or Attribute',
      'Record or Tuple',
      'Row or Entry',
      'Index or Key'
    ],
    correctAnswer: 0,
    points: 10
  },

  // MEDIUM - 10 Questions (Easy level - straightforward concepts)
  {
    id: 16,
    type: 'scenario',
    difficulty: 'medium',
    scenario: 'A library database stores books with columns: book_id, title, author, and year_published.',
    question: 'Which query retrieves all books written by "J.K. Rowling"?',
    options: [
      'SELECT * FROM books WHERE author = \'J.K. Rowling\'',
      'GET books WHERE author = \'J.K. Rowling\'',
      'FIND * FROM books IF author = \'J.K. Rowling\'',
      'SELECT books WHERE author == \'J.K. Rowling\''
    ],
    correctAnswer: 0,
    points: 15
  },
  {
    id: 17,
    type: 'mcq',
    difficulty: 'medium',
    question: 'Which SQL function counts the number of rows?',
    options: [
      'COUNT()',
      'SUM()',
      'TOTAL()',
      'NUMBER()'
    ],
    correctAnswer: 0,
    points: 15
  },
  {
    id: 18,
    type: 'mcq',
    difficulty: 'medium',
    question: 'Which SQL function calculates the average of a column?',
    options: [
      'AVG()',
      'AVERAGE()',
      'MEAN()',
      'MID()'
    ],
    correctAnswer: 0,
    points: 15
  },
  {
    id: 19,
    type: 'mcq',
    difficulty: 'medium',
    question: 'What is a FOREIGN KEY used for?',
    options: [
      'To link two tables together',
      'To create a unique identifier',
      'To encrypt sensitive data',
      'To speed up queries'
    ],
    correctAnswer: 0,
    points: 15
  },
  {
    id: 20,
    type: 'scenario',
    difficulty: 'medium',
    scenario: 'A Sales table has columns: sale_id, product_name, quantity, sale_date.',
    question: 'Which query shows total quantity sold for each product?',
    options: [
      'SELECT product_name, SUM(quantity) FROM Sales GROUP BY product_name',
      'SELECT product_name, COUNT(quantity) FROM Sales ORDER BY product_name',
      'SELECT product_name, SUM(quantity) FROM Sales ORDER BY product_name',
      'SELECT product_name, TOTAL(quantity) FROM Sales GROUP BY product_name'
    ],
    correctAnswer: 0,
    points: 15
  },
  {
    id: 21,
    type: 'mcq',
    difficulty: 'medium',
    question: 'Which clause is used with aggregate functions to filter groups?',
    options: [
      'HAVING',
      'WHERE',
      'FILTER',
      'GROUP FILTER'
    ],
    correctAnswer: 0,
    points: 15
  },
  {
    id: 22,
    type: 'mcq',
    difficulty: 'medium',
    question: 'What does NULL represent in a database?',
    options: [
      'Unknown or missing value',
      'Zero',
      'Empty string',
      'False'
    ],
    correctAnswer: 0,
    points: 15
  },
  {
    id: 23,
    type: 'mcq',
    difficulty: 'medium',
    question: 'Which JOIN returns only matching rows from both tables?',
    options: [
      'INNER JOIN',
      'LEFT JOIN',
      'RIGHT JOIN',
      'FULL JOIN'
    ],
    correctAnswer: 0,
    points: 15
  },
  {
    id: 24,
    type: 'mcq',
    difficulty: 'medium',
    question: 'Which command is used to add a new column to an existing table?',
    options: [
      'ALTER TABLE table_name ADD column_name',
      'UPDATE TABLE table_name ADD column_name',
      'INSERT COLUMN column_name INTO table_name',
      'MODIFY TABLE table_name ADD column_name'
    ],
    correctAnswer: 0,
    points: 15
  },
  {
    id: 25,
    type: 'mcq',
    difficulty: 'medium',
    question: 'What is normalization in databases?',
    options: [
      'Organizing data to reduce redundancy',
      'Making all data uppercase',
      'Encrypting sensitive information',
      'Speeding up database queries'
    ],
    correctAnswer: 0,
    points: 15
  },

  // HARD - 5 Questions (Medium level - requires understanding)
  {
    id: 26,
    type: 'scenario',
    difficulty: 'hard',
    scenario: 'A bank transfer moves Rs.5000 from Account A to Account B. The system debits A, then credits B.',
    question: 'Which ACID property ensures either both operations complete or neither does?',
    options: [
      'Atomicity',
      'Consistency',
      'Isolation',
      'Durability'
    ],
    correctAnswer: 0,
    points: 20
  },
  {
    id: 27,
    type: 'mcq',
    difficulty: 'hard',
    question: 'In 1NF (First Normal Form), what must be eliminated?',
    options: [
      'Repeating groups and multi-valued attributes',
      'Partial dependencies',
      'Transitive dependencies',
      'Foreign key references'
    ],
    correctAnswer: 0,
    points: 20
  },
  {
    id: 28,
    type: 'mcq',
    difficulty: 'hard',
    question: 'What is a Candidate Key?',
    options: [
      'A column or set of columns that can uniquely identify a row',
      'A key waiting to be promoted to primary key',
      'A temporary key used during data entry',
      'A key that references another table'
    ],
    correctAnswer: 0,
    points: 20
  },
  {
    id: 29,
    type: 'scenario',
    difficulty: 'hard',
    scenario: 'Two transactions T1 and T2 are running. T1 reads a value, T2 updates it, then T1 reads it again and gets a different value.',
    question: 'This scenario describes which concurrency problem?',
    options: [
      'Non-repeatable read',
      'Dirty read',
      'Phantom read',
      'Lost update'
    ],
    correctAnswer: 0,
    points: 20
  },
  {
    id: 30,
    type: 'mcq',
    difficulty: 'hard',
    question: 'Which ACID property ensures committed transactions survive system failures?',
    options: [
      'Durability',
      'Atomicity',
      'Consistency',
      'Isolation'
    ],
    correctAnswer: 0,
    points: 20
  }
]

// Round 2 SQL Challenges - LeetCode/HackerRank style with test cases
// 5 Easy (very straightforward), 3 Medium (easy level), 2 Hard (medium level)
const round2Challenges: SQLChallenge[] = [
  // EASY - 5 Challenges (Very straightforward queries)
  {
    id: 1,
    difficulty: 'easy',
    title: 'The Missing Employee',
    description: 'Write a query to find all employees in the "Engineering" department. Return all columns.',
    scenario: 'Techno Corp needs a list of all engineers for an important meeting.',
    schema: 'employees (emp_id, name, department, salary)',
    baseTableData: [{
      tableName: 'employees',
      columns: [
        { name: 'emp_id', type: 'INT', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'department', type: 'VARCHAR' },
        { name: 'salary', type: 'DECIMAL' }
      ],
      rows: [
        [1, 'Alice', 'Engineering', 75000],
        [2, 'Bob', 'Sales', 55000],
        [3, 'Charlie', 'Engineering', 80000],
        [4, 'Diana', 'HR', 60000],
        [5, 'Eve', 'Engineering', 72000]
      ]
    }],
    testCases: [
      {
        id: 1,
        name: 'Sample Test',
        description: 'Basic dataset with 5 employees',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'Alice', 'Engineering', 75000],
            [2, 'Bob', 'Sales', 55000],
            [3, 'Charlie', 'Engineering', 80000],
            [4, 'Diana', 'HR', 60000],
            [5, 'Eve', 'Engineering', 72000]
          ]
        }],
        expectedOutput: [
          [1, 'Alice', 'Engineering', 75000],
          [3, 'Charlie', 'Engineering', 80000],
          [5, 'Eve', 'Engineering', 72000]
        ],
        expectedColumns: ['emp_id', 'name', 'department', 'salary'],
        isHidden: false,
        points: 5
      },
      {
        id: 2,
        name: 'Test Case 2',
        description: 'Single engineering employee',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'John', 'Engineering', 90000],
            [2, 'Jane', 'Marketing', 65000]
          ]
        }],
        expectedOutput: [
          [1, 'John', 'Engineering', 90000]
        ],
        expectedColumns: ['emp_id', 'name', 'department', 'salary'],
        isHidden: false,
        points: 5
      },
      {
        id: 3,
        name: 'Hidden Test',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'Sam', 'Engineering', 85000],
            [2, 'Max', 'Engineering', 78000],
            [3, 'Leo', 'Finance', 70000],
            [4, 'Mia', 'Engineering', 92000]
          ]
        }],
        expectedOutput: [
          [1, 'Sam', 'Engineering', 85000],
          [2, 'Max', 'Engineering', 78000],
          [4, 'Mia', 'Engineering', 92000]
        ],
        expectedColumns: ['emp_id', 'name', 'department', 'salary'],
        isHidden: true,
        points: 5
      }
    ],
    expectedKeywords: ['select', 'from', 'employees', 'where', 'department', 'engineering'],
    totalPoints: 15,
    timeLimit: 180
  },
  {
    id: 2,
    difficulty: 'easy',
    title: 'Count the Orders',
    description: 'Write a query to count the total number of orders.',
    scenario: 'QuickMart needs a count of all orders for their monthly report.',
    schema: 'orders (order_id, customer_id, order_date, total_amount)',
    baseTableData: [{
      tableName: 'orders',
      columns: [
        { name: 'order_id', type: 'INT', isPrimaryKey: true },
        { name: 'customer_id', type: 'INT' },
        { name: 'order_date', type: 'DATE' },
        { name: 'total_amount', type: 'DECIMAL' }
      ],
      rows: [
        [101, 1, '2024-01-15', 2500],
        [102, 2, '2024-01-16', 1800],
        [103, 1, '2024-01-17', 3200],
        [104, 3, '2024-01-18', 950],
        [105, 2, '2024-01-19', 4100]
      ]
    }],
    testCases: [
      {
        id: 1,
        name: 'Sample Test',
        description: '5 orders in dataset',
        tableData: [{
          tableName: 'orders',
          columns: [
            { name: 'order_id', type: 'INT', isPrimaryKey: true },
            { name: 'customer_id', type: 'INT' },
            { name: 'order_date', type: 'DATE' },
            { name: 'total_amount', type: 'DECIMAL' }
          ],
          rows: [
            [101, 1, '2024-01-15', 2500],
            [102, 2, '2024-01-16', 1800],
            [103, 1, '2024-01-17', 3200],
            [104, 3, '2024-01-18', 950],
            [105, 2, '2024-01-19', 4100]
          ]
        }],
        expectedOutput: [[5]],
        expectedColumns: ['count'],
        isHidden: false,
        points: 5
      },
      {
        id: 2,
        name: 'Test Case 2',
        description: 'Empty orders table',
        tableData: [{
          tableName: 'orders',
          columns: [
            { name: 'order_id', type: 'INT', isPrimaryKey: true },
            { name: 'customer_id', type: 'INT' },
            { name: 'order_date', type: 'DATE' },
            { name: 'total_amount', type: 'DECIMAL' }
          ],
          rows: []
        }],
        expectedOutput: [[0]],
        expectedColumns: ['count'],
        isHidden: false,
        points: 5
      },
      {
        id: 3,
        name: 'Hidden Test',
        tableData: [{
          tableName: 'orders',
          columns: [
            { name: 'order_id', type: 'INT', isPrimaryKey: true },
            { name: 'customer_id', type: 'INT' },
            { name: 'order_date', type: 'DATE' },
            { name: 'total_amount', type: 'DECIMAL' }
          ],
          rows: [
            [1, 1, '2024-02-01', 500],
            [2, 1, '2024-02-02', 600],
            [3, 2, '2024-02-03', 700]
          ]
        }],
        expectedOutput: [[3]],
        expectedColumns: ['count'],
        isHidden: true,
        points: 5
      }
    ],
    expectedKeywords: ['select', 'count', 'from', 'orders'],
    totalPoints: 15,
    timeLimit: 180
  },
  {
    id: 3,
    difficulty: 'easy',
    title: 'Top Spenders',
    description: 'Find all customers who have spent more than Rs.10000 in total. Return all columns.',
    scenario: 'Marketing wants to identify premium customers for a loyalty program.',
    schema: 'customers (customer_id, name, email, total_spent)',
    baseTableData: [{
      tableName: 'customers',
      columns: [
        { name: 'customer_id', type: 'INT', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'email', type: 'VARCHAR' },
        { name: 'total_spent', type: 'DECIMAL' }
      ],
      rows: [
        [1, 'Rahul', 'rahul@email.com', 15000],
        [2, 'Priya', 'priya@email.com', 8500],
        [3, 'Amit', 'amit@email.com', 22000],
        [4, 'Sneha', 'sneha@email.com', 5000],
        [5, 'Vikram', 'vikram@email.com', 12500]
      ]
    }],
    testCases: [
      {
        id: 1,
        name: 'Sample Test',
        description: 'Standard customer dataset',
        tableData: [{
          tableName: 'customers',
          columns: [
            { name: 'customer_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'email', type: 'VARCHAR' },
            { name: 'total_spent', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'Rahul', 'rahul@email.com', 15000],
            [2, 'Priya', 'priya@email.com', 8500],
            [3, 'Amit', 'amit@email.com', 22000],
            [4, 'Sneha', 'sneha@email.com', 5000],
            [5, 'Vikram', 'vikram@email.com', 12500]
          ]
        }],
        expectedOutput: [
          [1, 'Rahul', 'rahul@email.com', 15000],
          [3, 'Amit', 'amit@email.com', 22000],
          [5, 'Vikram', 'vikram@email.com', 12500]
        ],
        expectedColumns: ['customer_id', 'name', 'email', 'total_spent'],
        isHidden: false,
        points: 5
      },
      {
        id: 2,
        name: 'Test Case 2',
        description: 'Edge case - exactly 10000',
        tableData: [{
          tableName: 'customers',
          columns: [
            { name: 'customer_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'email', type: 'VARCHAR' },
            { name: 'total_spent', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'Test', 'test@email.com', 10000],
            [2, 'User', 'user@email.com', 10001]
          ]
        }],
        expectedOutput: [
          [2, 'User', 'user@email.com', 10001]
        ],
        expectedColumns: ['customer_id', 'name', 'email', 'total_spent'],
        isHidden: false,
        points: 5
      },
      {
        id: 3,
        name: 'Hidden Test',
        tableData: [{
          tableName: 'customers',
          columns: [
            { name: 'customer_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'email', type: 'VARCHAR' },
            { name: 'total_spent', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'A', 'a@x.com', 50000],
            [2, 'B', 'b@x.com', 9999],
            [3, 'C', 'c@x.com', 100000]
          ]
        }],
        expectedOutput: [
          [1, 'A', 'a@x.com', 50000],
          [3, 'C', 'c@x.com', 100000]
        ],
        expectedColumns: ['customer_id', 'name', 'email', 'total_spent'],
        isHidden: true,
        points: 5
      }
    ],
    expectedKeywords: ['select', 'from', 'customers', 'where', 'total_spent', '>'],
    totalPoints: 15,
    timeLimit: 180
  },
  {
    id: 4,
    difficulty: 'easy',
    title: 'Product Catalog',
    description: 'List all products sorted by price from lowest to highest. Return all columns.',
    scenario: 'A budget-conscious shopper wants to see products starting from cheapest.',
    schema: 'products (product_id, name, category, price)',
    baseTableData: [{
      tableName: 'products',
      columns: [
        { name: 'product_id', type: 'INT', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'category', type: 'VARCHAR' },
        { name: 'price', type: 'DECIMAL' }
      ],
      rows: [
        [1, 'Laptop', 'Electronics', 45000],
        [2, 'Mouse', 'Electronics', 500],
        [3, 'Keyboard', 'Electronics', 1200],
        [4, 'Monitor', 'Electronics', 15000],
        [5, 'USB Cable', 'Electronics', 150]
      ]
    }],
    testCases: [
      {
        id: 1,
        name: 'Sample Test',
        description: 'Sort 5 products by price',
        tableData: [{
          tableName: 'products',
          columns: [
            { name: 'product_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'category', type: 'VARCHAR' },
            { name: 'price', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'Laptop', 'Electronics', 45000],
            [2, 'Mouse', 'Electronics', 500],
            [3, 'Keyboard', 'Electronics', 1200],
            [4, 'Monitor', 'Electronics', 15000],
            [5, 'USB Cable', 'Electronics', 150]
          ]
        }],
        expectedOutput: [
          [5, 'USB Cable', 'Electronics', 150],
          [2, 'Mouse', 'Electronics', 500],
          [3, 'Keyboard', 'Electronics', 1200],
          [4, 'Monitor', 'Electronics', 15000],
          [1, 'Laptop', 'Electronics', 45000]
        ],
        expectedColumns: ['product_id', 'name', 'category', 'price'],
        isHidden: false,
        points: 8
      },
      {
        id: 2,
        name: 'Hidden Test',
        tableData: [{
          tableName: 'products',
          columns: [
            { name: 'product_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'category', type: 'VARCHAR' },
            { name: 'price', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'Chair', 'Furniture', 3000],
            [2, 'Desk', 'Furniture', 8000],
            [3, 'Lamp', 'Furniture', 1500]
          ]
        }],
        expectedOutput: [
          [3, 'Lamp', 'Furniture', 1500],
          [1, 'Chair', 'Furniture', 3000],
          [2, 'Desk', 'Furniture', 8000]
        ],
        expectedColumns: ['product_id', 'name', 'category', 'price'],
        isHidden: true,
        points: 7
      }
    ],
    expectedKeywords: ['select', 'from', 'products', 'order', 'by', 'price'],
    totalPoints: 15,
    timeLimit: 180
  },
  {
    id: 5,
    difficulty: 'easy',
    title: 'Unique Departments',
    description: 'List all unique departments in the company. Return only the department column.',
    scenario: 'The new HR intern needs to know all different departments.',
    schema: 'employees (emp_id, name, department, salary)',
    baseTableData: [{
      tableName: 'employees',
      columns: [
        { name: 'emp_id', type: 'INT', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'department', type: 'VARCHAR' },
        { name: 'salary', type: 'DECIMAL' }
      ],
      rows: [
        [1, 'Alice', 'Engineering', 75000],
        [2, 'Bob', 'Sales', 55000],
        [3, 'Charlie', 'Engineering', 80000],
        [4, 'Diana', 'HR', 60000],
        [5, 'Eve', 'Sales', 52000]
      ]
    }],
    testCases: [
      {
        id: 1,
        name: 'Sample Test',
        description: '3 unique departments',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'Alice', 'Engineering', 75000],
            [2, 'Bob', 'Sales', 55000],
            [3, 'Charlie', 'Engineering', 80000],
            [4, 'Diana', 'HR', 60000],
            [5, 'Eve', 'Sales', 52000]
          ]
        }],
        expectedOutput: [['Engineering'], ['Sales'], ['HR']],
        expectedColumns: ['department'],
        isHidden: false,
        points: 8
      },
      {
        id: 2,
        name: 'Hidden Test',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'A', 'IT', 50000],
            [2, 'B', 'IT', 55000],
            [3, 'C', 'Finance', 60000],
            [4, 'D', 'IT', 52000],
            [5, 'E', 'Legal', 70000]
          ]
        }],
        expectedOutput: [['IT'], ['Finance'], ['Legal']],
        expectedColumns: ['department'],
        isHidden: true,
        points: 7
      }
    ],
    expectedKeywords: ['select', 'distinct', 'department', 'from', 'employees'],
    totalPoints: 15,
    timeLimit: 180
  },

  // MEDIUM - 3 Challenges (Easy-level complexity)
  {
    id: 6,
    difficulty: 'medium',
    title: 'Department Salary Report',
    description: 'Calculate the average salary for each department. Return department name and average salary.',
    scenario: 'Finance team needs average salaries by department for budget.',
    schema: 'employees (emp_id, name, department, salary)',
    baseTableData: [{
      tableName: 'employees',
      columns: [
        { name: 'emp_id', type: 'INT', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'department', type: 'VARCHAR' },
        { name: 'salary', type: 'DECIMAL' }
      ],
      rows: [
        [1, 'Alice', 'Engineering', 75000],
        [2, 'Bob', 'Sales', 55000],
        [3, 'Charlie', 'Engineering', 80000],
        [4, 'Diana', 'HR', 60000],
        [5, 'Eve', 'Sales', 65000],
        [6, 'Frank', 'Engineering', 70000]
      ]
    }],
    testCases: [
      {
        id: 1,
        name: 'Sample Test',
        description: '3 departments with varying sizes',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'Alice', 'Engineering', 75000],
            [2, 'Bob', 'Sales', 55000],
            [3, 'Charlie', 'Engineering', 80000],
            [4, 'Diana', 'HR', 60000],
            [5, 'Eve', 'Sales', 65000],
            [6, 'Frank', 'Engineering', 70000]
          ]
        }],
        expectedOutput: [
          ['Engineering', 75000],
          ['Sales', 60000],
          ['HR', 60000]
        ],
        expectedColumns: ['department', 'avg_salary'],
        isHidden: false,
        points: 8
      },
      {
        id: 2,
        name: 'Test Case 2',
        description: 'Single employee departments',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'John', 'IT', 80000],
            [2, 'Jane', 'Marketing', 70000]
          ]
        }],
        expectedOutput: [
          ['IT', 80000],
          ['Marketing', 70000]
        ],
        expectedColumns: ['department', 'avg_salary'],
        isHidden: false,
        points: 8
      },
      {
        id: 3,
        name: 'Hidden Test',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'A', 'Dev', 100000],
            [2, 'B', 'Dev', 120000],
            [3, 'C', 'QA', 80000],
            [4, 'D', 'QA', 90000],
            [5, 'E', 'QA', 85000]
          ]
        }],
        expectedOutput: [
          ['Dev', 110000],
          ['QA', 85000]
        ],
        expectedColumns: ['department', 'avg_salary'],
        isHidden: true,
        points: 9
      }
    ],
    expectedKeywords: ['select', 'department', 'avg', 'salary', 'from', 'employees', 'group', 'by'],
  totalPoints: 25,
  timeLimit: 240
  },
  {
    id: 7,
    difficulty: 'medium',
    title: 'Customer Orders Link',
    description: 'Show customer names along with their order IDs using JOIN. Return name and order_id.',
    scenario: 'Support team needs to see which orders belong to which customers.',
    schema: 'customers (customer_id, name) | orders (order_id, customer_id, total_amount)',
    baseTableData: [
      {
        tableName: 'customers',
        columns: [
          { name: 'customer_id', type: 'INT', isPrimaryKey: true },
          { name: 'name', type: 'VARCHAR' }
        ],
        rows: [
          [1, 'Rahul'],
          [2, 'Priya'],
          [3, 'Amit']
        ]
      },
      {
        tableName: 'orders',
        columns: [
          { name: 'order_id', type: 'INT', isPrimaryKey: true },
          { name: 'customer_id', type: 'INT', isForeignKey: true },
          { name: 'total_amount', type: 'DECIMAL' }
        ],
        rows: [
          [101, 1, 2500],
          [102, 2, 1800],
          [103, 1, 3200],
          [104, 3, 950]
        ]
      }
    ],
    testCases: [
      {
        id: 1,
        name: 'Sample Test',
        description: '3 customers, 4 orders',
        tableData: [
          {
            tableName: 'customers',
            columns: [
              { name: 'customer_id', type: 'INT', isPrimaryKey: true },
              { name: 'name', type: 'VARCHAR' }
            ],
            rows: [
              [1, 'Rahul'],
              [2, 'Priya'],
              [3, 'Amit']
            ]
          },
          {
            tableName: 'orders',
            columns: [
              { name: 'order_id', type: 'INT', isPrimaryKey: true },
              { name: 'customer_id', type: 'INT', isForeignKey: true },
              { name: 'total_amount', type: 'DECIMAL' }
            ],
            rows: [
              [101, 1, 2500],
              [102, 2, 1800],
              [103, 1, 3200],
              [104, 3, 950]
            ]
          }
        ],
        expectedOutput: [
          ['Rahul', 101],
          ['Priya', 102],
          ['Rahul', 103],
          ['Amit', 104]
        ],
        expectedColumns: ['name', 'order_id'],
        isHidden: false,
        points: 8
      },
      {
        id: 2,
        name: 'Test Case 2',
        description: 'Single customer with multiple orders',
        tableData: [
          {
            tableName: 'customers',
            columns: [
              { name: 'customer_id', type: 'INT', isPrimaryKey: true },
              { name: 'name', type: 'VARCHAR' }
            ],
            rows: [
              [1, 'John']
            ]
          },
          {
            tableName: 'orders',
            columns: [
              { name: 'order_id', type: 'INT', isPrimaryKey: true },
              { name: 'customer_id', type: 'INT', isForeignKey: true },
              { name: 'total_amount', type: 'DECIMAL' }
            ],
            rows: [
              [1, 1, 100],
              [2, 1, 200],
              [3, 1, 300]
            ]
          }
        ],
        expectedOutput: [
          ['John', 1],
          ['John', 2],
          ['John', 3]
        ],
        expectedColumns: ['name', 'order_id'],
        isHidden: false,
        points: 8
      },
      {
        id: 3,
        name: 'Hidden Test',
        tableData: [
          {
            tableName: 'customers',
            columns: [
              { name: 'customer_id', type: 'INT', isPrimaryKey: true },
              { name: 'name', type: 'VARCHAR' }
            ],
            rows: [
              [1, 'Alice'],
              [2, 'Bob']
            ]
          },
          {
            tableName: 'orders',
            columns: [
              { name: 'order_id', type: 'INT', isPrimaryKey: true },
              { name: 'customer_id', type: 'INT', isForeignKey: true },
              { name: 'total_amount', type: 'DECIMAL' }
            ],
            rows: [
              [10, 2, 500],
              [11, 1, 600]
            ]
          }
        ],
        expectedOutput: [
          ['Bob', 10],
          ['Alice', 11]
        ],
        expectedColumns: ['name', 'order_id'],
        isHidden: true,
        points: 9
      }
    ],
    expectedKeywords: ['select', 'join', 'on', 'customer_id'],
  totalPoints: 25,
  timeLimit: 240
  },
  {
    id: 8,
    difficulty: 'medium',
    title: 'Big Departments Only',
    description: 'Find departments that have more than 2 employees. Return department and employee count.',
    scenario: 'Management wants to identify large departments.',
    schema: 'employees (emp_id, name, department, salary)',
    baseTableData: [{
      tableName: 'employees',
      columns: [
        { name: 'emp_id', type: 'INT', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'department', type: 'VARCHAR' },
        { name: 'salary', type: 'DECIMAL' }
      ],
      rows: [
        [1, 'Alice', 'Engineering', 75000],
        [2, 'Bob', 'Sales', 55000],
        [3, 'Charlie', 'Engineering', 80000],
        [4, 'Diana', 'HR', 60000],
        [5, 'Eve', 'Engineering', 72000],
        [6, 'Frank', 'Sales', 58000],
        [7, 'Grace', 'Engineering', 78000]
      ]
    }],
    testCases: [
      {
        id: 1,
        name: 'Sample Test',
        description: 'Mix of small and large departments',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'Alice', 'Engineering', 75000],
            [2, 'Bob', 'Sales', 55000],
            [3, 'Charlie', 'Engineering', 80000],
            [4, 'Diana', 'HR', 60000],
            [5, 'Eve', 'Engineering', 72000],
            [6, 'Frank', 'Sales', 58000],
            [7, 'Grace', 'Engineering', 78000]
          ]
        }],
        expectedOutput: [['Engineering', 4]],
        expectedColumns: ['department', 'count'],
        isHidden: false,
        points: 8
      },
      {
        id: 2,
        name: 'Test Case 2',
        description: 'Edge case - exactly 2 employees',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'A', 'IT', 50000],
            [2, 'B', 'IT', 55000],
            [3, 'C', 'Finance', 60000],
            [4, 'D', 'Finance', 65000],
            [5, 'E', 'Finance', 70000]
          ]
        }],
        expectedOutput: [['Finance', 3]],
        expectedColumns: ['department', 'count'],
        isHidden: false,
        points: 8
      },
      {
        id: 3,
        name: 'Hidden Test',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'A', 'Dev', 80000],
            [2, 'B', 'Dev', 85000],
            [3, 'C', 'Dev', 90000],
            [4, 'D', 'Dev', 95000],
            [5, 'E', 'QA', 70000],
            [6, 'F', 'QA', 75000],
            [7, 'G', 'QA', 80000]
          ]
        }],
        expectedOutput: [['Dev', 4], ['QA', 3]],
        expectedColumns: ['department', 'count'],
        isHidden: true,
        points: 9
      }
    ],
    expectedKeywords: ['select', 'department', 'count', 'group', 'by', 'having'],
  totalPoints: 25,
  timeLimit: 240
  },

  // HARD - 2 Challenges (Medium-level complexity)
  {
    id: 9,
    difficulty: 'hard',
    title: 'Second Highest Salary',
    description: 'Find the second highest salary in the company. Return just the salary value.',
    scenario: 'Payroll needs to find the second highest earner for an audit.',
    schema: 'employees (emp_id, name, department, salary)',
    baseTableData: [{
      tableName: 'employees',
      columns: [
        { name: 'emp_id', type: 'INT', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'department', type: 'VARCHAR' },
        { name: 'salary', type: 'DECIMAL' }
      ],
      rows: [
        [1, 'Alice', 'Engineering', 75000],
        [2, 'Bob', 'Sales', 55000],
        [3, 'Charlie', 'Engineering', 95000],
        [4, 'Diana', 'HR', 60000],
        [5, 'Eve', 'Engineering', 85000]
      ]
    }],
    testCases: [
      {
        id: 1,
        name: 'Sample Test',
        description: '5 employees with distinct salaries',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'Alice', 'Engineering', 75000],
            [2, 'Bob', 'Sales', 55000],
            [3, 'Charlie', 'Engineering', 95000],
            [4, 'Diana', 'HR', 60000],
            [5, 'Eve', 'Engineering', 85000]
          ]
        }],
        expectedOutput: [[85000]],
        expectedColumns: ['salary'],
        isHidden: false,
        points: 10
      },
      {
        id: 2,
        name: 'Test Case 2',
        description: 'Only 2 employees',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'John', 'IT', 100000],
            [2, 'Jane', 'IT', 90000]
          ]
        }],
        expectedOutput: [[90000]],
        expectedColumns: ['salary'],
        isHidden: false,
        points: 10
      },
      {
        id: 3,
        name: 'Hidden Test 1',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'A', 'X', 200000],
            [2, 'B', 'Y', 150000],
            [3, 'C', 'Z', 180000]
          ]
        }],
        expectedOutput: [[180000]],
        expectedColumns: ['salary'],
        isHidden: true,
        points: 8
      },
      {
        id: 4,
        name: 'Hidden Test 2',
        tableData: [{
          tableName: 'employees',
          columns: [
            { name: 'emp_id', type: 'INT', isPrimaryKey: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'department', type: 'VARCHAR' },
            { name: 'salary', type: 'DECIMAL' }
          ],
          rows: [
            [1, 'A', 'X', 50000],
            [2, 'B', 'Y', 60000],
            [3, 'C', 'Z', 70000],
            [4, 'D', 'W', 80000]
          ]
        }],
        expectedOutput: [[70000]],
        expectedColumns: ['salary'],
        isHidden: true,
        points: 7
      }
    ],
    expectedKeywords: ['select', 'max', 'salary', 'from', 'employees', 'where', '<'],
  totalPoints: 35,
  timeLimit: 300
  },
  {
    id: 10,
    difficulty: 'hard',
    title: 'Inactive Customers',
    description: 'Find customers who have never placed an order. Return customer_id and name.',
    scenario: 'Marketing wants to reach out to customers with no purchases.',
    schema: 'customers (customer_id, name) | orders (order_id, customer_id)',
    baseTableData: [
      {
        tableName: 'customers',
        columns: [
          { name: 'customer_id', type: 'INT', isPrimaryKey: true },
          { name: 'name', type: 'VARCHAR' }
        ],
        rows: [
          [1, 'Rahul'],
          [2, 'Priya'],
          [3, 'Amit'],
          [4, 'Sneha'],
          [5, 'Vikram']
        ]
      },
      {
        tableName: 'orders',
        columns: [
          { name: 'order_id', type: 'INT', isPrimaryKey: true },
          { name: 'customer_id', type: 'INT', isForeignKey: true }
        ],
        rows: [
          [101, 1],
          [102, 2],
          [103, 1]
        ]
      }
    ],
    testCases: [
      {
        id: 1,
        name: 'Sample Test',
        description: '5 customers, 3 with orders',
        tableData: [
          {
            tableName: 'customers',
            columns: [
              { name: 'customer_id', type: 'INT', isPrimaryKey: true },
              { name: 'name', type: 'VARCHAR' }
            ],
            rows: [
              [1, 'Rahul'],
              [2, 'Priya'],
              [3, 'Amit'],
              [4, 'Sneha'],
              [5, 'Vikram']
            ]
          },
          {
            tableName: 'orders',
            columns: [
              { name: 'order_id', type: 'INT', isPrimaryKey: true },
              { name: 'customer_id', type: 'INT', isForeignKey: true }
            ],
            rows: [
              [101, 1],
              [102, 2],
              [103, 1]
            ]
          }
        ],
        expectedOutput: [
          [3, 'Amit'],
          [4, 'Sneha'],
          [5, 'Vikram']
        ],
        expectedColumns: ['customer_id', 'name'],
        isHidden: false,
        points: 10
      },
      {
        id: 2,
        name: 'Test Case 2',
        description: 'All customers inactive',
        tableData: [
          {
            tableName: 'customers',
            columns: [
              { name: 'customer_id', type: 'INT', isPrimaryKey: true },
              { name: 'name', type: 'VARCHAR' }
            ],
            rows: [
              [1, 'John'],
              [2, 'Jane']
            ]
          },
          {
            tableName: 'orders',
            columns: [
              { name: 'order_id', type: 'INT', isPrimaryKey: true },
              { name: 'customer_id', type: 'INT', isForeignKey: true }
            ],
            rows: []
          }
        ],
        expectedOutput: [
          [1, 'John'],
          [2, 'Jane']
        ],
        expectedColumns: ['customer_id', 'name'],
        isHidden: false,
        points: 10
      },
      {
        id: 3,
        name: 'Hidden Test 1',
        tableData: [
          {
            tableName: 'customers',
            columns: [
              { name: 'customer_id', type: 'INT', isPrimaryKey: true },
              { name: 'name', type: 'VARCHAR' }
            ],
            rows: [
              [1, 'A'],
              [2, 'B'],
              [3, 'C']
            ]
          },
          {
            tableName: 'orders',
            columns: [
              { name: 'order_id', type: 'INT', isPrimaryKey: true },
              { name: 'customer_id', type: 'INT', isForeignKey: true }
            ],
            rows: [
              [1, 1],
              [2, 3]
            ]
          }
        ],
        expectedOutput: [
          [2, 'B']
        ],
        expectedColumns: ['customer_id', 'name'],
        isHidden: true,
        points: 8
      },
      {
        id: 4,
        name: 'Hidden Test 2',
        tableData: [
          {
            tableName: 'customers',
            columns: [
              { name: 'customer_id', type: 'INT', isPrimaryKey: true },
              { name: 'name', type: 'VARCHAR' }
            ],
            rows: [
              [1, 'X'],
              [2, 'Y'],
              [3, 'Z'],
              [4, 'W']
            ]
          },
          {
            tableName: 'orders',
            columns: [
              { name: 'order_id', type: 'INT', isPrimaryKey: true },
              { name: 'customer_id', type: 'INT', isForeignKey: true }
            ],
            rows: [
              [1, 2]
            ]
          }
        ],
        expectedOutput: [
          [1, 'X'],
          [3, 'Z'],
          [4, 'W']
        ],
        expectedColumns: ['customer_id', 'name'],
        isHidden: true,
        points: 7
      }
    ],
    expectedKeywords: ['select', 'from', 'customers', 'where', 'not', 'in'],
  totalPoints: 35,
  timeLimit: 300
  }
]

const createInitialPlayer = (id: string): Player => ({
  id,
  name: id,
  score: 0,
  round1Score: 0,
  round2Score: 0,
  round1Completed: false,
  round2Enabled: false,
  round2Completed: false,
  tabSwitchCount: 0,
  isDisqualified: false,
  round1Answers: {}
})

export const useGameStore = create<GameState>((set, get) => ({
  currentView: 'landing',
  isFullscreen: false,
  currentPlayer: null,
  players: [],
  currentRound: 1,
  currentQuestionIndex: 0,
  timeRemaining: 0,
  isTimerRunning: false,
  tabSwitchCount: 0,
  maxTabSwitches: 3,
  isProctoring: false,
  violations: [],
  round1Questions,
  round2Challenges,
  isAdmin: false,
  adminPassword: 'ITRIX2026ADMIN',

  setView: (view) => set({ currentView: view }),

  login: async (code) => {
    const normalizedCode = code.toUpperCase().trim()
    
    // Always fetch fresh data from database to ensure round completion status is accurate
    // This prevents users from re-attending rounds they've already completed
    const player = await fetchPlayerById(normalizedCode)
    if (player) {
      set(s => ({
        currentPlayer: player,
        players: s.players.some(p => p.id === player.id) 
          ? s.players.map(p => p.id === player.id ? player : p) // Update existing with fresh data
          : [...s.players, player],
        currentView: 'dashboard',
        isProctoring: true
      }))
      return true
    }
    
    return false
  },

  adminLogin: (password) => {
    if (password === get().adminPassword) {
      set({ isAdmin: true, currentView: 'admin' })
      return true
    }
    return false
  },

  logout: () => set({
    currentPlayer: null,
    currentView: 'landing',
    isAdmin: false,
    isProctoring: false,
    tabSwitchCount: 0,
    violations: []
  }),

  startRound1: () => {
    const state = get()
    // Prevent re-attending if already completed
    if (!state.currentPlayer || state.currentPlayer.round1Completed) return

    // Shuffle questions within each difficulty group (easy, medium, hard) then combine
    // This ensures each participant sees questions in random order within their difficulty level
    const shuffledQuestions = shuffleByDifficulty(state.round1Questions)

    set({
      currentRound: 1,
      currentQuestionIndex: 0,
      timeRemaining: 45 * 60, // 45 minutes
      isTimerRunning: true,
      currentView: 'round1',
      round1Questions: shuffledQuestions
    })
  },

  startRound2: () => {
    const state = get()
    // Prevent re-attending if already completed or not enabled
    if (!state.currentPlayer || !state.currentPlayer.round2Enabled || state.currentPlayer.round2Completed) return

    // Shuffle challenges within each difficulty group (easy, medium, hard) then combine
    const shuffledChallenges = shuffleByDifficulty(state.round2Challenges)

    set({
      currentRound: 2,
      currentQuestionIndex: 0,
      timeRemaining: 30 * 60, // 30 minutes for Round 2
      isTimerRunning: true,
      currentView: 'round2',
      round2Challenges: shuffledChallenges
    })
  },

  saveAnswer: (questionId, answer) => {
    const state = get()
    if (!state.currentPlayer) return

    const updatedAnswers = { ...state.currentPlayer.round1Answers, [questionId]: answer }

    set(s => ({
      currentPlayer: s.currentPlayer ? { ...s.currentPlayer, round1Answers: updatedAnswers } : null
    }))
  },

  goToQuestion: (index) => {
    set({ currentQuestionIndex: index })
  },

  submitRound1: async () => {
    const state = get()
    if (!state.currentPlayer) return

    // Calculate score based on saved answers
    let totalScore = 0
    state.round1Questions.forEach(q => {
      const answer = state.currentPlayer?.round1Answers[q.id]
      if (answer === q.correctAnswer) {
        totalScore += q.points
      }
    })

    const updatedPlayer = {
      ...state.currentPlayer,
      round1Score: totalScore,
      score: totalScore,
      round1Completed: true
    }

    // Update local state first for immediate UI feedback
    set(s => ({
      currentPlayer: updatedPlayer,
      players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p),
      currentView: 'dashboard',
      isTimerRunning: false
    }))

    // Sync to database and wait for it to complete
    try {
      await dbUpdatePlayer(updatedPlayer)
    } catch (error) {
      console.error('Failed to sync player to database:', error)
    }
  },

runTestCases: (_code) => {
    // Deprecated: Use runTestCasesWithEngine from lib/sql-executor.ts instead
    // This stub remains for type compatibility
    return []
  },

  submitRound2Answer: (code) => {
    const state = get()
    const emptyResult: SubmissionResult = {
      testResults: [],
      totalPassed: 0,
      totalTests: 0,
      pointsEarned: 0,
      allPassed: false
    }
    
    if (!state.currentPlayer) return emptyResult
    
    const challenge = state.round2Challenges[state.currentQuestionIndex]
    if (!challenge) return emptyResult
    
    // Run all test cases
    const testResults = get().runTestCases(code)
    const totalPassed = testResults.filter(r => r.passed).length
    const totalTests = testResults.length
    
    // Calculate points based on test cases passed
    let pointsEarned = 0
    challenge.testCases.forEach((tc, idx) => {
      if (testResults[idx]?.passed) {
        pointsEarned += tc.points
      }
    })
    
    const allPassed = totalPassed === totalTests
    
    if (pointsEarned > 0) {
      const updatedPlayer = {
        ...state.currentPlayer,
        round2Score: state.currentPlayer.round2Score + pointsEarned,
        score: state.currentPlayer.score + pointsEarned
      }
      
      set(s => ({
        currentPlayer: updatedPlayer,
        players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
      }))
      
      // Sync to database asynchronously
      dbUpdatePlayer(updatedPlayer).catch(error => {
        console.error('Failed to sync player score to database:', error)
      })
    }
    
    return {
      testResults,
      totalPassed,
      totalTests,
      pointsEarned,
      allPassed
    }
  },

  nextChallenge: () => {
    const state = get()
    const totalChallenges = state.round2Challenges.length

    if (state.currentQuestionIndex >= totalChallenges - 1) {
      // Round 2 complete - use finishRound2 for proper completion
      get().finishRound2()
    } else {
      set({ currentQuestionIndex: state.currentQuestionIndex + 1 })
    }
  },

  finishRound2: async () => {
    const state = get()
    if (!state.currentPlayer) return

    // Mark round 2 as completed
    const updatedPlayer = {
      ...state.currentPlayer,
      round2Completed: true
    }

    // Update local state immediately
    set(s => ({
      currentPlayer: updatedPlayer,
      players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p),
      currentView: 'dashboard',
      isTimerRunning: false
    }))

    // Sync to database and wait for completion
    try {
      await dbUpdatePlayer(updatedPlayer)
    } catch (error) {
      console.error('Failed to sync round2 completion to database:', error)
    }
  },

  recordTabSwitch: () => {
    const state = get()
    const newCount = state.tabSwitchCount + 1

    if (newCount >= state.maxTabSwitches && state.currentPlayer) {
      const updatedPlayer = { ...state.currentPlayer, isDisqualified: true, tabSwitchCount: newCount }
      set(s => ({
        tabSwitchCount: newCount,
        violations: [...s.violations, `Disqualified: ${newCount} tab switches`],
        currentPlayer: updatedPlayer,
        players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p),
        currentView: 'dashboard'
      }))
      // Sync disqualification to database
      dbUpdatePlayer(updatedPlayer).catch(error => {
        console.error('Failed to sync disqualification to database:', error)
      })
      return false
    }

    set(s => ({
      tabSwitchCount: newCount,
      violations: [...s.violations, `Tab switch detected (${newCount}/${s.maxTabSwitches})`]
    }))
    return true
  },

  setFullscreen: (isFullscreen) => set({ isFullscreen }),

  updateTimer: (time) => set({ timeRemaining: time }),

  addViolation: (violation) => set(s => ({ violations: [...s.violations, violation] })),

  updateLeaderboard: () => {
    const players = get().players
      .filter(p => !p.isDisqualified)
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        rank: index + 1,
        player,
        totalScore: player.score
      }))
    return players
  },

  addPlayer: (code, studentDetails) => {
    const normalizedCode = code.toUpperCase().trim()
    const exists = get().players.find(p => p.id === normalizedCode)
    if (exists) return

    const newPlayer = {
      ...createInitialPlayer(normalizedCode),
      name: studentDetails?.name || normalizedCode,
      college: studentDetails?.college || '',
      department: studentDetails?.department || '',
      yearOfStudy: studentDetails?.yearOfStudy || '',
      contactNumber: studentDetails?.contactNumber || '',
      email: studentDetails?.email || '',
    }
    set(s => ({ players: [...s.players, newPlayer] }))

    // Sync to database
    dbCreatePlayer(normalizedCode, studentDetails)
  },

  removePlayer: (id) => {
    set(s => ({
      players: s.players.filter(p => p.id !== id)
    }))
    // Sync to database
    dbDeletePlayer(id)
  },

  enableRound2: (playerId) => {
    set(s => ({
      players: s.players.map(p =>
        p.id === playerId ? { ...p, round2Enabled: true } : p
      ),
      currentPlayer: s.currentPlayer?.id === playerId
        ? { ...s.currentPlayer, round2Enabled: true }
        : s.currentPlayer
    }))
    // Sync to database
    enableRound2ForPlayer(playerId)
  },

  disableRound2: (playerId) => {
    set(s => ({
      players: s.players.map(p =>
        p.id === playerId ? { ...p, round2Enabled: false } : p
      ),
      currentPlayer: s.currentPlayer?.id === playerId
        ? { ...s.currentPlayer, round2Enabled: false }
        : s.currentPlayer
    }))
    // Sync to database
    disableRound2ForPlayer(playerId)
  },

  resetGame: () => {
    set(s => ({
      players: s.players.map(p => ({
        ...p,
        score: 0,
        round1Score: 0,
        round2Score: 0,
        round1Completed: false,
        round2Enabled: false,
        round2Completed: false,
        tabSwitchCount: 0,
        isDisqualified: false,
        round1Answers: {}
      }))
    }))
    // Sync to database
    resetAllPlayers()
  },

  loadPlayers: async () => {
    const dbPlayers = await fetchAllPlayers()
    
    // Merge database players with local state, preferring local scores if they're higher
    // This prevents overwriting locally updated scores with stale DB data
    set(state => {
      const localPlayerMap = new Map(state.players.map(p => [p.id, p]))
      
      const mergedPlayers = dbPlayers.map(dbPlayer => {
        const localPlayer = localPlayerMap.get(dbPlayer.id)
        if (localPlayer) {
          // If local player has higher scores, keep them (they may not have synced to DB yet)
          return {
            ...dbPlayer,
            score: Math.max(localPlayer.score, dbPlayer.score),
            round1Score: Math.max(localPlayer.round1Score, dbPlayer.round1Score),
            round2Score: Math.max(localPlayer.round2Score, dbPlayer.round2Score),
            round1Completed: localPlayer.round1Completed || dbPlayer.round1Completed,
            round2Completed: localPlayer.round2Completed || dbPlayer.round2Completed,
          }
        }
        return dbPlayer
      })
      
      // Also include any local players not in DB yet
      const dbPlayerIds = new Set(dbPlayers.map(p => p.id))
      const localOnlyPlayers = state.players.filter(p => !dbPlayerIds.has(p.id))
      
      // Update currentPlayer if it exists in the merged list
      const allPlayers = [...mergedPlayers, ...localOnlyPlayers]
      const updatedCurrentPlayer = state.currentPlayer 
        ? allPlayers.find(p => p.id === state.currentPlayer!.id) || state.currentPlayer
        : null
      
      return { 
        players: allPlayers,
        currentPlayer: updatedCurrentPlayer
      }
    })
  },

  syncPlayerToDb: async (player) => {
    await dbUpdatePlayer(player)
  },

  // Load questions from database
  loadRound1Questions: async () => {
    const dbQuestions = await fetchRound1Questions()
    if (dbQuestions.length > 0) {
      set({ round1Questions: dbQuestions })
    }
    // If no questions in DB, keep the default hardcoded ones
  },

  // Question management functions - now using database
  addRound1Question: async (question) => {
    const newQuestion = await dbCreateRound1Question(question)
    if (newQuestion) {
      set(s => ({ round1Questions: [...s.round1Questions, newQuestion] }))
    }
  },

  updateRound1Question: async (id, question) => {
    const updated = await dbUpdateRound1Question(id, question)
    if (updated) {
      set(s => ({
        round1Questions: s.round1Questions.map(q => 
          q.id === id ? updated : q
        )
      }))
    }
  },

  deleteRound1Question: async (id) => {
    const success = await dbDeleteRound1Question(id)
    if (success) {
      set(s => ({
        round1Questions: s.round1Questions.filter(q => q.id !== id)
      }))
    }
  },

  // Load challenges from database
  loadRound2Challenges: async () => {
    const dbChallenges = await fetchRound2Challenges()
    if (dbChallenges.length > 0) {
      set({ round2Challenges: dbChallenges })
    }
    // If no challenges in DB, keep the default hardcoded ones
  },

  // Round 2 management
  updateRound2Tables: (tables) => {
    // Update base table data for all challenges
    set(s => ({
      round2Challenges: s.round2Challenges.map(c => ({
        ...c,
        baseTableData: tables
      }))
    }))
  },

  addRound2Challenge: async (challenge) => {
    const newChallenge = await dbCreateRound2Challenge(challenge)
    if (newChallenge) {
      set(s => ({ round2Challenges: [...s.round2Challenges, newChallenge] }))
    }
  },

  updateRound2Challenge: async (id, challenge) => {
    const updated = await dbUpdateRound2Challenge(id, challenge)
    if (updated) {
      set(s => ({
        round2Challenges: s.round2Challenges.map(c => 
          c.id === id ? updated : c
        )
      }))
    }
  },

  deleteRound2Challenge: async (id) => {
    const success = await dbDeleteRound2Challenge(id)
    if (success) {
      set(s => ({
        round2Challenges: s.round2Challenges.filter(c => c.id !== id)
      }))
    }
  }
}))
