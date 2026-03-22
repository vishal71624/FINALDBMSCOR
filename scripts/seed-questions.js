import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const round1Questions = [
  // EASY - 15 Questions
  { type: 'mcq', difficulty: 'easy', question: 'What does SQL stand for?', options: ['Structured Query Language', 'Strong Query Language', 'Simple Query Language', 'Structured Question Language'], correct_answer: 0, points: 10 },
  { type: 'mcq', difficulty: 'easy', question: 'Which SQL command is used to retrieve records from a table?', options: ['SELECT', 'RETRIEVE', 'GET', 'FETCH'], correct_answer: 0, points: 10 },
  { type: 'mcq', difficulty: 'easy', question: 'Which SQL command is used to add new data to a table?', options: ['INSERT', 'ADD', 'APPEND', 'PUT'], correct_answer: 0, points: 10 },
  { type: 'mcq', difficulty: 'easy', question: 'Which SQL command is used to modify existing records?', options: ['UPDATE', 'MODIFY', 'CHANGE', 'ALTER'], correct_answer: 0, points: 10 },
  { type: 'mcq', difficulty: 'easy', question: 'Which SQL command is used to remove records from a table?', options: ['DELETE', 'REMOVE', 'DROP', 'ERASE'], correct_answer: 0, points: 10 },
  { type: 'mcq', difficulty: 'easy', question: 'What is a PRIMARY KEY in a database?', options: ['A unique identifier for each record in a table', 'The first column in any table', 'A password to access the database', 'The most important data in a table'], correct_answer: 0, points: 10 },
  { type: 'mcq', difficulty: 'easy', question: 'Which clause is used to filter records in SQL?', options: ['WHERE', 'FILTER', 'HAVING', 'IF'], correct_answer: 0, points: 10 },
  { type: 'mcq', difficulty: 'easy', question: 'Which clause is used to sort results in SQL?', options: ['ORDER BY', 'SORT BY', 'ARRANGE BY', 'GROUP BY'], correct_answer: 0, points: 10 },
  { type: 'mcq', difficulty: 'easy', question: 'What does DBMS stand for?', options: ['Database Management System', 'Data Backup Management System', 'Digital Base Management System', 'Database Maintenance System'], correct_answer: 0, points: 10 },
  { type: 'mcq', difficulty: 'easy', question: 'Which SQL command creates a new table?', options: ['CREATE TABLE', 'NEW TABLE', 'MAKE TABLE', 'ADD TABLE'], correct_answer: 0, points: 10 },
  { type: 'mcq', difficulty: 'easy', question: 'Which SQL command deletes an entire table?', options: ['DROP TABLE', 'DELETE TABLE', 'REMOVE TABLE', 'ERASE TABLE'], correct_answer: 0, points: 10 },
  { type: 'mcq', difficulty: 'easy', question: 'What symbol is used to select all columns in SQL?', options: ['* (asterisk)', '# (hash)', '@ (at)', '& (ampersand)'], correct_answer: 0, points: 10 },
  { type: 'mcq', difficulty: 'easy', question: 'Which keyword removes duplicate values from results?', options: ['DISTINCT', 'UNIQUE', 'DIFFERENT', 'SINGLE'], correct_answer: 0, points: 10 },
  { type: 'mcq', difficulty: 'easy', question: 'What is a row in a database table also called?', options: ['Record or Tuple', 'Column or Field', 'Index or Key', 'Schema or Structure'], correct_answer: 0, points: 10 },
  { type: 'mcq', difficulty: 'easy', question: 'What is a column in a database table also called?', options: ['Field or Attribute', 'Record or Tuple', 'Row or Entry', 'Index or Key'], correct_answer: 0, points: 10 },

  // MEDIUM - 10 Questions
  { type: 'scenario', difficulty: 'medium', scenario: 'A library database stores books with columns: book_id, title, author, and year_published.', question: 'Which query retrieves all books written by "J.K. Rowling"?', options: ['SELECT * FROM books WHERE author = \'J.K. Rowling\'', 'GET books WHERE author = \'J.K. Rowling\'', 'FIND * FROM books IF author = \'J.K. Rowling\'', 'SELECT books WHERE author == \'J.K. Rowling\''], correct_answer: 0, points: 15 },
  { type: 'mcq', difficulty: 'medium', question: 'Which SQL function counts the number of rows?', options: ['COUNT()', 'SUM()', 'TOTAL()', 'NUMBER()'], correct_answer: 0, points: 15 },
  { type: 'mcq', difficulty: 'medium', question: 'Which SQL function calculates the average of a column?', options: ['AVG()', 'AVERAGE()', 'MEAN()', 'MID()'], correct_answer: 0, points: 15 },
  { type: 'mcq', difficulty: 'medium', question: 'What is a FOREIGN KEY used for?', options: ['To link two tables together', 'To create a unique identifier', 'To encrypt sensitive data', 'To speed up queries'], correct_answer: 0, points: 15 },
  { type: 'scenario', difficulty: 'medium', scenario: 'A Sales table has columns: sale_id, product_name, quantity, sale_date.', question: 'Which query shows total quantity sold for each product?', options: ['SELECT product_name, SUM(quantity) FROM Sales GROUP BY product_name', 'SELECT product_name, COUNT(quantity) FROM Sales ORDER BY product_name', 'SELECT product_name, SUM(quantity) FROM Sales ORDER BY product_name', 'SELECT product_name, TOTAL(quantity) FROM Sales GROUP BY product_name'], correct_answer: 0, points: 15 },
  { type: 'mcq', difficulty: 'medium', question: 'Which clause is used with aggregate functions to filter groups?', options: ['HAVING', 'WHERE', 'FILTER', 'GROUP FILTER'], correct_answer: 0, points: 15 },
  { type: 'mcq', difficulty: 'medium', question: 'What does NULL represent in a database?', options: ['Unknown or missing value', 'Zero', 'Empty string', 'False'], correct_answer: 0, points: 15 },
  { type: 'mcq', difficulty: 'medium', question: 'Which JOIN returns only matching rows from both tables?', options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'], correct_answer: 0, points: 15 },
  { type: 'mcq', difficulty: 'medium', question: 'Which command is used to add a new column to an existing table?', options: ['ALTER TABLE table_name ADD column_name', 'UPDATE TABLE table_name ADD column_name', 'INSERT COLUMN column_name INTO table_name', 'MODIFY TABLE table_name ADD column_name'], correct_answer: 0, points: 15 },
  { type: 'mcq', difficulty: 'medium', question: 'What is normalization in databases?', options: ['Organizing data to reduce redundancy', 'Making all data uppercase', 'Encrypting sensitive information', 'Speeding up database queries'], correct_answer: 0, points: 15 },

  // HARD - 5 Questions
  { type: 'scenario', difficulty: 'hard', scenario: 'A bank transfer moves Rs.5000 from Account A to Account B. The system debits A, then credits B.', question: 'Which ACID property ensures either both operations complete or neither does?', options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'], correct_answer: 0, points: 20 },
  { type: 'mcq', difficulty: 'hard', question: 'In 1NF (First Normal Form), what must be eliminated?', options: ['Repeating groups and multi-valued attributes', 'Partial dependencies', 'Transitive dependencies', 'Foreign key references'], correct_answer: 0, points: 20 },
  { type: 'mcq', difficulty: 'hard', question: 'What is a Candidate Key?', options: ['A column or set of columns that can uniquely identify a row', 'A key waiting to be promoted to primary key', 'A temporary key used during data entry', 'A key that references another table'], correct_answer: 0, points: 20 },
  { type: 'scenario', difficulty: 'hard', scenario: 'Two transactions T1 and T2 are running. T1 reads a value, T2 updates it, then T1 reads it again and gets a different value.', question: 'This scenario describes which concurrency problem?', options: ['Non-repeatable read', 'Dirty read', 'Phantom read', 'Lost update'], correct_answer: 0, points: 20 },
  { type: 'mcq', difficulty: 'hard', question: 'Which ACID property ensures committed transactions survive system failures?', options: ['Durability', 'Atomicity', 'Consistency', 'Isolation'], correct_answer: 0, points: 20 },
]

const round2Challenges = [
  {
    difficulty: 'easy',
    title: 'The Missing Employee',
    description: 'Write a query to find all employees in the "Engineering" department. Return all columns.',
    scenario: 'Techno Corp needs a list of all engineers for an important meeting.',
    schema: 'employees (emp_id, name, department, salary)',
    base_table_data: [{ tableName: 'employees', columns: ['emp_id', 'name', 'department', 'salary'], rows: [[1, 'Alice', 'Engineering', 75000], [2, 'Bob', 'Sales', 55000], [3, 'Charlie', 'Engineering', 80000], [4, 'Diana', 'HR', 60000], [5, 'Eve', 'Engineering', 72000]] }],
    test_cases: [{ id: 1, name: 'Sample Test', description: 'Basic dataset with 5 employees', expectedOutput: 3, points: 5, isHidden: false }],
    expected_keywords: ['SELECT', 'FROM', 'WHERE', 'Engineering'],
    total_points: 15,
    time_limit: 180
  },
  {
    difficulty: 'easy',
    title: 'Count the Orders',
    description: 'Write a query to count the total number of orders.',
    scenario: 'QuickMart needs a count of all orders for their monthly report.',
    schema: 'orders (order_id, customer_id, order_date, total_amount)',
    base_table_data: [{ tableName: 'orders', columns: ['order_id', 'customer_id', 'order_date', 'total_amount'], rows: [[101, 1, '2024-01-15', 2500], [102, 2, '2024-01-16', 1800], [103, 1, '2024-01-17', 3200], [104, 3, '2024-01-18', 950], [105, 2, '2024-01-19', 4100]] }],
    test_cases: [{ id: 1, name: 'Sample Test', description: '5 orders in dataset', expectedOutput: 5, points: 5, isHidden: false }],
    expected_keywords: ['SELECT', 'COUNT', 'FROM', 'orders'],
    total_points: 15,
    time_limit: 180
  },
  {
    difficulty: 'easy',
    title: 'Top Spenders',
    description: 'Find all customers who have spent more than Rs.10000 in total. Return all columns.',
    scenario: 'Marketing wants to identify premium customers for a loyalty program.',
    schema: 'customers (customer_id, name, email, total_spent)',
    base_table_data: [{ tableName: 'customers', columns: ['customer_id', 'name', 'email', 'total_spent'], rows: [[1, 'Rahul', 'rahul@email.com', 15000], [2, 'Priya', 'priya@email.com', 8500], [3, 'Amit', 'amit@email.com', 22000], [4, 'Sneha', 'sneha@email.com', 5000], [5, 'Vikram', 'vikram@email.com', 12500]] }],
    test_cases: [{ id: 1, name: 'Sample Test', description: 'Standard customer dataset', expectedOutput: 3, points: 5, isHidden: false }],
    expected_keywords: ['SELECT', 'FROM', 'WHERE', 'total_spent'],
    total_points: 15,
    time_limit: 180
  },
  {
    difficulty: 'easy',
    title: 'Product Catalog',
    description: 'List all products sorted by price from lowest to highest. Return all columns.',
    scenario: 'A budget-conscious shopper wants to see products starting from cheapest.',
    schema: 'products (product_id, name, category, price)',
    base_table_data: [{ tableName: 'products', columns: ['product_id', 'name', 'category', 'price'], rows: [[1, 'Laptop', 'Electronics', 45000], [2, 'Mouse', 'Electronics', 500], [3, 'Keyboard', 'Electronics', 1200], [4, 'Monitor', 'Electronics', 15000], [5, 'USB Cable', 'Electronics', 150]] }],
    test_cases: [{ id: 1, name: 'Sample Test', description: 'Sort 5 products by price', expectedOutput: 5, points: 8, isHidden: false }],
    expected_keywords: ['SELECT', 'FROM', 'ORDER', 'BY', 'price'],
    total_points: 15,
    time_limit: 180
  },
  {
    difficulty: 'easy',
    title: 'Unique Departments',
    description: 'List all unique departments in the company. Return only the department column.',
    scenario: 'The new HR intern needs to know all different departments.',
    schema: 'employees (emp_id, name, department, salary)',
    base_table_data: [{ tableName: 'employees', columns: ['emp_id', 'name', 'department', 'salary'], rows: [[1, 'John', 'IT', 80000], [2, 'Jane', 'HR', 70000], [3, 'Jack', 'IT', 85000], [4, 'Jill', 'Finance', 75000]] }],
    test_cases: [{ id: 1, name: 'Sample Test', description: 'Find unique departments', expectedOutput: 3, points: 5, isHidden: false }],
    expected_keywords: ['SELECT', 'DISTINCT', 'FROM', 'employees'],
    total_points: 15,
    time_limit: 180
  },
]

async function insertData() {
  try {
    // Insert Round 1 Questions
    console.log('Inserting Round 1 Questions...')
    const { error: r1Error } = await supabase
      .from('round1_questions')
      .insert(round1Questions)

    if (r1Error) {
      console.error('Error inserting round1 questions:', r1Error)
    } else {
      console.log(`Successfully inserted ${round1Questions.length} Round 1 questions`)
    }

    // Insert Round 2 Challenges
    console.log('Inserting Round 2 Challenges...')
    const { error: r2Error } = await supabase
      .from('round2_challenges')
      .insert(round2Challenges)

    if (r2Error) {
      console.error('Error inserting round2 challenges:', r2Error)
    } else {
      console.log(`Successfully inserted ${round2Challenges.length} Round 2 challenges`)
    }

    console.log('Data insertion complete!')
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

insertData()
