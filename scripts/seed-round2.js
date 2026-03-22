import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const round2Challenges = [
  // ─── EASY 1 ───────────────────────────────────────────────────────────────
  {
    difficulty: 'easy',
    title: 'The Missing Employee',
    description: 'Write a query to find all employees in the "Engineering" department. Return all columns.',
    scenario: 'Techno Corp needs a list of all engineers for an important meeting.',
    schema: 'employees (emp_id, name, department, salary)',
    base_table_data: [{
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
    test_cases: [
      {
        id: 1, name: 'Sample Test', description: 'Basic dataset with 5 employees', isHidden: false, points: 5,
        tableData: [{
          tableName: 'employees',
          columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'department', type: 'VARCHAR' }, { name: 'salary', type: 'DECIMAL' }],
          rows: [[1,'Alice','Engineering',75000],[2,'Bob','Sales',55000],[3,'Charlie','Engineering',80000],[4,'Diana','HR',60000],[5,'Eve','Engineering',72000]]
        }],
        expectedOutput: [[1,'Alice','Engineering',75000],[3,'Charlie','Engineering',80000],[5,'Eve','Engineering',72000]],
        expectedColumns: ['emp_id','name','department','salary']
      },
      {
        id: 2, name: 'Test Case 2', description: 'Single engineering employee', isHidden: false, points: 5,
        tableData: [{
          tableName: 'employees',
          columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'department', type: 'VARCHAR' }, { name: 'salary', type: 'DECIMAL' }],
          rows: [[1,'John','Engineering',90000],[2,'Jane','Marketing',65000]]
        }],
        expectedOutput: [[1,'John','Engineering',90000]],
        expectedColumns: ['emp_id','name','department','salary']
      },
      {
        id: 3, name: 'Hidden Test', isHidden: true, points: 5,
        tableData: [{
          tableName: 'employees',
          columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'department', type: 'VARCHAR' }, { name: 'salary', type: 'DECIMAL' }],
          rows: [[1,'Sam','Engineering',85000],[2,'Max','Engineering',78000],[3,'Leo','Finance',70000],[4,'Mia','Engineering',92000]]
        }],
        expectedOutput: [[1,'Sam','Engineering',85000],[2,'Max','Engineering',78000],[4,'Mia','Engineering',92000]],
        expectedColumns: ['emp_id','name','department','salary']
      }
    ],
    expected_keywords: ['select','from','employees','where','department','engineering'],
    total_points: 15,
    time_limit: 180,
    is_active: true
  },

  // ─── EASY 2 ───────────────────────────────────────────────────────────────
  {
    difficulty: 'easy',
    title: 'Count the Orders',
    description: 'Write a query to count the total number of orders.',
    scenario: 'QuickMart needs a count of all orders for their monthly report.',
    schema: 'orders (order_id, customer_id, order_date, total_amount)',
    base_table_data: [{
      tableName: 'orders',
      columns: [
        { name: 'order_id', type: 'INT', isPrimaryKey: true },
        { name: 'customer_id', type: 'INT' },
        { name: 'order_date', type: 'DATE' },
        { name: 'total_amount', type: 'DECIMAL' }
      ],
      rows: [[101,1,'2024-01-15',2500],[102,2,'2024-01-16',1800],[103,1,'2024-01-17',3200],[104,3,'2024-01-18',950],[105,2,'2024-01-19',4100]]
    }],
    test_cases: [
      {
        id: 1, name: 'Sample Test', description: '5 orders in dataset', isHidden: false, points: 5,
        tableData: [{
          tableName: 'orders',
          columns: [{ name: 'order_id', type: 'INT', isPrimaryKey: true }, { name: 'customer_id', type: 'INT' }, { name: 'order_date', type: 'DATE' }, { name: 'total_amount', type: 'DECIMAL' }],
          rows: [[101,1,'2024-01-15',2500],[102,2,'2024-01-16',1800],[103,1,'2024-01-17',3200],[104,3,'2024-01-18',950],[105,2,'2024-01-19',4100]]
        }],
        expectedOutput: [[5]],
        expectedColumns: ['count']
      },
      {
        id: 2, name: 'Test Case 2', description: 'Empty orders table', isHidden: false, points: 5,
        tableData: [{
          tableName: 'orders',
          columns: [{ name: 'order_id', type: 'INT', isPrimaryKey: true }, { name: 'customer_id', type: 'INT' }, { name: 'order_date', type: 'DATE' }, { name: 'total_amount', type: 'DECIMAL' }],
          rows: []
        }],
        expectedOutput: [[0]],
        expectedColumns: ['count']
      },
      {
        id: 3, name: 'Hidden Test', isHidden: true, points: 5,
        tableData: [{
          tableName: 'orders',
          columns: [{ name: 'order_id', type: 'INT', isPrimaryKey: true }, { name: 'customer_id', type: 'INT' }, { name: 'order_date', type: 'DATE' }, { name: 'total_amount', type: 'DECIMAL' }],
          rows: [[1,1,'2024-02-01',500],[2,1,'2024-02-02',600],[3,2,'2024-02-03',700]]
        }],
        expectedOutput: [[3]],
        expectedColumns: ['count']
      }
    ],
    expected_keywords: ['select','count','from','orders'],
    total_points: 15,
    time_limit: 180,
    is_active: true
  },

  // ─── EASY 3 ───────────────────────────────────────────────────────────────
  {
    difficulty: 'easy',
    title: 'Top Spenders',
    description: 'Find all customers who have spent more than Rs.10000 in total. Return all columns.',
    scenario: 'Marketing wants to identify premium customers for a loyalty program.',
    schema: 'customers (customer_id, name, email, total_spent)',
    base_table_data: [{
      tableName: 'customers',
      columns: [
        { name: 'customer_id', type: 'INT', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'email', type: 'VARCHAR' },
        { name: 'total_spent', type: 'DECIMAL' }
      ],
      rows: [[1,'Rahul','rahul@email.com',15000],[2,'Priya','priya@email.com',8500],[3,'Amit','amit@email.com',22000],[4,'Sneha','sneha@email.com',5000],[5,'Vikram','vikram@email.com',12500]]
    }],
    test_cases: [
      {
        id: 1, name: 'Sample Test', description: 'Standard customer dataset', isHidden: false, points: 5,
        tableData: [{
          tableName: 'customers',
          columns: [{ name: 'customer_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'email', type: 'VARCHAR' }, { name: 'total_spent', type: 'DECIMAL' }],
          rows: [[1,'Rahul','rahul@email.com',15000],[2,'Priya','priya@email.com',8500],[3,'Amit','amit@email.com',22000],[4,'Sneha','sneha@email.com',5000],[5,'Vikram','vikram@email.com',12500]]
        }],
        expectedOutput: [[1,'Rahul','rahul@email.com',15000],[3,'Amit','amit@email.com',22000],[5,'Vikram','vikram@email.com',12500]],
        expectedColumns: ['customer_id','name','email','total_spent']
      },
      {
        id: 2, name: 'Test Case 2', description: 'Edge case - exactly 10000', isHidden: false, points: 5,
        tableData: [{
          tableName: 'customers',
          columns: [{ name: 'customer_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'email', type: 'VARCHAR' }, { name: 'total_spent', type: 'DECIMAL' }],
          rows: [[1,'Test','test@email.com',10000],[2,'User','user@email.com',10001]]
        }],
        expectedOutput: [[2,'User','user@email.com',10001]],
        expectedColumns: ['customer_id','name','email','total_spent']
      },
      {
        id: 3, name: 'Hidden Test', isHidden: true, points: 5,
        tableData: [{
          tableName: 'customers',
          columns: [{ name: 'customer_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'email', type: 'VARCHAR' }, { name: 'total_spent', type: 'DECIMAL' }],
          rows: [[1,'A','a@x.com',50000],[2,'B','b@x.com',9999],[3,'C','c@x.com',100000]]
        }],
        expectedOutput: [[1,'A','a@x.com',50000],[3,'C','c@x.com',100000]],
        expectedColumns: ['customer_id','name','email','total_spent']
      }
    ],
    expected_keywords: ['select','from','customers','where','total_spent','>'],
    total_points: 15,
    time_limit: 180,
    is_active: true
  },

  // ─── EASY 4 ───────────────────────────────────────────────────────────────
  {
    difficulty: 'easy',
    title: 'Product Catalog',
    description: 'List all products sorted by price from lowest to highest. Return all columns.',
    scenario: 'A budget-conscious shopper wants to see products starting from cheapest.',
    schema: 'products (product_id, name, category, price)',
    base_table_data: [{
      tableName: 'products',
      columns: [
        { name: 'product_id', type: 'INT', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'category', type: 'VARCHAR' },
        { name: 'price', type: 'DECIMAL' }
      ],
      rows: [[1,'Laptop','Electronics',45000],[2,'Mouse','Electronics',500],[3,'Keyboard','Electronics',1200],[4,'Monitor','Electronics',15000],[5,'USB Cable','Electronics',150]]
    }],
    test_cases: [
      {
        id: 1, name: 'Sample Test', description: 'Sort 5 products by price', isHidden: false, points: 5,
        tableData: [{
          tableName: 'products',
          columns: [{ name: 'product_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'category', type: 'VARCHAR' }, { name: 'price', type: 'DECIMAL' }],
          rows: [[1,'Laptop','Electronics',45000],[2,'Mouse','Electronics',500],[3,'Keyboard','Electronics',1200],[4,'Monitor','Electronics',15000],[5,'USB Cable','Electronics',150]]
        }],
        expectedOutput: [[5,'USB Cable','Electronics',150],[2,'Mouse','Electronics',500],[3,'Keyboard','Electronics',1200],[4,'Monitor','Electronics',15000],[1,'Laptop','Electronics',45000]],
        expectedColumns: ['product_id','name','category','price']
      },
      {
        id: 2, name: 'Test Case 2', description: 'Three products already sorted', isHidden: false, points: 5,
        tableData: [{
          tableName: 'products',
          columns: [{ name: 'product_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'category', type: 'VARCHAR' }, { name: 'price', type: 'DECIMAL' }],
          rows: [[1,'Pen','Stationery',10],[2,'Notebook','Stationery',50],[3,'Bag','Accessories',500]]
        }],
        expectedOutput: [[1,'Pen','Stationery',10],[2,'Notebook','Stationery',50],[3,'Bag','Accessories',500]],
        expectedColumns: ['product_id','name','category','price']
      },
      {
        id: 3, name: 'Hidden Test', isHidden: true, points: 5,
        tableData: [{
          tableName: 'products',
          columns: [{ name: 'product_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'category', type: 'VARCHAR' }, { name: 'price', type: 'DECIMAL' }],
          rows: [[1,'Z',null,999],[2,'A',null,1],[3,'M',null,100]]
        }],
        expectedOutput: [[2,'A',null,1],[3,'M',null,100],[1,'Z',null,999]],
        expectedColumns: ['product_id','name','category','price']
      }
    ],
    expected_keywords: ['select','from','products','order','by','price'],
    total_points: 15,
    time_limit: 180,
    is_active: true
  },

  // ─── EASY 5 ───────────────────────────────────────────────────────────────
  {
    difficulty: 'easy',
    title: 'Unique Departments',
    description: 'List all unique departments in the company. Return only the department column.',
    scenario: 'The new HR intern needs to know all different departments that exist.',
    schema: 'employees (emp_id, name, department, salary)',
    base_table_data: [{
      tableName: 'employees',
      columns: [
        { name: 'emp_id', type: 'INT', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'department', type: 'VARCHAR' },
        { name: 'salary', type: 'DECIMAL' }
      ],
      rows: [[1,'John','IT',80000],[2,'Jane','HR',70000],[3,'Jack','IT',85000],[4,'Jill','Finance',75000]]
    }],
    test_cases: [
      {
        id: 1, name: 'Sample Test', description: 'Find unique departments', isHidden: false, points: 5,
        tableData: [{
          tableName: 'employees',
          columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'department', type: 'VARCHAR' }, { name: 'salary', type: 'DECIMAL' }],
          rows: [[1,'John','IT',80000],[2,'Jane','HR',70000],[3,'Jack','IT',85000],[4,'Jill','Finance',75000]]
        }],
        expectedOutput: [['Finance'],['HR'],['IT']],
        expectedColumns: ['department']
      },
      {
        id: 2, name: 'Test Case 2', description: 'All same department', isHidden: false, points: 5,
        tableData: [{
          tableName: 'employees',
          columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'department', type: 'VARCHAR' }, { name: 'salary', type: 'DECIMAL' }],
          rows: [[1,'A','Sales',50000],[2,'B','Sales',55000],[3,'C','Sales',60000]]
        }],
        expectedOutput: [['Sales']],
        expectedColumns: ['department']
      },
      {
        id: 3, name: 'Hidden Test', isHidden: true, points: 5,
        tableData: [{
          tableName: 'employees',
          columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'department', type: 'VARCHAR' }, { name: 'salary', type: 'DECIMAL' }],
          rows: [[1,'P','Admin',40000],[2,'Q','Marketing',45000],[3,'R','Admin',42000],[4,'S','Legal',70000],[5,'T','Marketing',48000]]
        }],
        expectedOutput: [['Admin'],['Legal'],['Marketing']],
        expectedColumns: ['department']
      }
    ],
    expected_keywords: ['select','distinct','from','employees'],
    total_points: 15,
    time_limit: 180,
    is_active: true
  },

  // ─── MEDIUM 1 ─────────────────────────────────────────────────────────────
  {
    difficulty: 'medium',
    title: 'Sales by Product',
    description: 'Find the total revenue (SUM of total_amount) for each product. Return product_name and total_revenue, ordered by total_revenue descending.',
    scenario: 'The CFO wants to know which products generate the most revenue.',
    schema: 'sales (sale_id, product_name, quantity, total_amount)',
    base_table_data: [{
      tableName: 'sales',
      columns: [
        { name: 'sale_id', type: 'INT', isPrimaryKey: true },
        { name: 'product_name', type: 'VARCHAR' },
        { name: 'quantity', type: 'INT' },
        { name: 'total_amount', type: 'DECIMAL' }
      ],
      rows: [[1,'Laptop',2,90000],[2,'Mouse',5,2500],[3,'Laptop',1,45000],[4,'Keyboard',3,3600],[5,'Mouse',2,1000]]
    }],
    test_cases: [
      {
        id: 1, name: 'Sample Test', description: 'Mixed product sales', isHidden: false, points: 10,
        tableData: [{
          tableName: 'sales',
          columns: [{ name: 'sale_id', type: 'INT', isPrimaryKey: true }, { name: 'product_name', type: 'VARCHAR' }, { name: 'quantity', type: 'INT' }, { name: 'total_amount', type: 'DECIMAL' }],
          rows: [[1,'Laptop',2,90000],[2,'Mouse',5,2500],[3,'Laptop',1,45000],[4,'Keyboard',3,3600],[5,'Mouse',2,1000]]
        }],
        expectedOutput: [['Laptop',135000],['Keyboard',3600],['Mouse',3500]],
        expectedColumns: ['product_name','total_revenue']
      },
      {
        id: 2, name: 'Hidden Test', isHidden: true, points: 10,
        tableData: [{
          tableName: 'sales',
          columns: [{ name: 'sale_id', type: 'INT', isPrimaryKey: true }, { name: 'product_name', type: 'VARCHAR' }, { name: 'quantity', type: 'INT' }, { name: 'total_amount', type: 'DECIMAL' }],
          rows: [[1,'A',1,100],[2,'B',1,200],[3,'A',1,150]]
        }],
        expectedOutput: [['B',200],['A',250]],
        expectedColumns: ['product_name','total_revenue']
      }
    ],
    expected_keywords: ['select','sum','from','sales','group','by','order','by'],
    total_points: 20,
    time_limit: 240,
    is_active: true
  },

  // ─── MEDIUM 2 ─────────────────────────────────────────────────────────────
  {
    difficulty: 'medium',
    title: 'High Salary Departments',
    description: 'Find departments where the average salary is greater than 70000. Return department and avg_salary.',
    scenario: 'HR wants to identify well-compensated departments for budget planning.',
    schema: 'employees (emp_id, name, department, salary)',
    base_table_data: [{
      tableName: 'employees',
      columns: [
        { name: 'emp_id', type: 'INT', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'department', type: 'VARCHAR' },
        { name: 'salary', type: 'DECIMAL' }
      ],
      rows: [[1,'Alice','Engineering',85000],[2,'Bob','Engineering',75000],[3,'Carol','HR',60000],[4,'Dan','HR',55000],[5,'Eve','Finance',90000]]
    }],
    test_cases: [
      {
        id: 1, name: 'Sample Test', description: 'Standard employee dataset', isHidden: false, points: 10,
        tableData: [{
          tableName: 'employees',
          columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'department', type: 'VARCHAR' }, { name: 'salary', type: 'DECIMAL' }],
          rows: [[1,'Alice','Engineering',85000],[2,'Bob','Engineering',75000],[3,'Carol','HR',60000],[4,'Dan','HR',55000],[5,'Eve','Finance',90000]]
        }],
        expectedOutput: [['Engineering',80000],['Finance',90000]],
        expectedColumns: ['department','avg_salary']
      },
      {
        id: 2, name: 'Hidden Test', isHidden: true, points: 10,
        tableData: [{
          tableName: 'employees',
          columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'department', type: 'VARCHAR' }, { name: 'salary', type: 'DECIMAL' }],
          rows: [[1,'X','IT',50000],[2,'Y','IT',80000],[3,'Z','Sales',70000]]
        }],
        expectedOutput: [['IT',65000]],
        expectedColumns: ['department','avg_salary']
      }
    ],
    expected_keywords: ['select','avg','from','employees','group','by','having'],
    total_points: 20,
    time_limit: 240,
    is_active: true
  },

  // ─── MEDIUM 3 ─────────────────────────────────────────────────────────────
  {
    difficulty: 'medium',
    title: 'Customer Orders Join',
    description: 'List each customer name along with their total number of orders. Return customer_name and order_count.',
    scenario: 'CRM team wants to see how active each customer is.',
    schema: 'customers (customer_id, name), orders (order_id, customer_id, amount)',
    base_table_data: [
      {
        tableName: 'customers',
        columns: [{ name: 'customer_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }],
        rows: [[1,'Rahul'],[2,'Priya'],[3,'Amit']]
      },
      {
        tableName: 'orders',
        columns: [{ name: 'order_id', type: 'INT', isPrimaryKey: true }, { name: 'customer_id', type: 'INT', isForeignKey: true }, { name: 'amount', type: 'DECIMAL' }],
        rows: [[1,1,500],[2,1,800],[3,2,300],[4,3,1200],[5,1,200]]
      }
    ],
    test_cases: [
      {
        id: 1, name: 'Sample Test', description: '3 customers, 5 orders', isHidden: false, points: 10,
        tableData: [
          {
            tableName: 'customers',
            columns: [{ name: 'customer_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }],
            rows: [[1,'Rahul'],[2,'Priya'],[3,'Amit']]
          },
          {
            tableName: 'orders',
            columns: [{ name: 'order_id', type: 'INT', isPrimaryKey: true }, { name: 'customer_id', type: 'INT', isForeignKey: true }, { name: 'amount', type: 'DECIMAL' }],
            rows: [[1,1,500],[2,1,800],[3,2,300],[4,3,1200],[5,1,200]]
          }
        ],
        expectedOutput: [['Rahul',3],['Priya',1],['Amit',1]],
        expectedColumns: ['customer_name','order_count']
      },
      {
        id: 2, name: 'Hidden Test', isHidden: true, points: 10,
        tableData: [
          {
            tableName: 'customers',
            columns: [{ name: 'customer_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }],
            rows: [[1,'A'],[2,'B']]
          },
          {
            tableName: 'orders',
            columns: [{ name: 'order_id', type: 'INT', isPrimaryKey: true }, { name: 'customer_id', type: 'INT', isForeignKey: true }, { name: 'amount', type: 'DECIMAL' }],
            rows: [[1,2,100],[2,2,200]]
          }
        ],
        expectedOutput: [['B',2]],
        expectedColumns: ['customer_name','order_count']
      }
    ],
    expected_keywords: ['select','from','customers','join','orders','group','by','count'],
    total_points: 20,
    time_limit: 300,
    is_active: true
  },

  // ─── HARD 1 ───────────────────────────────────────────────────────────────
  {
    difficulty: 'hard',
    title: 'Second Highest Salary',
    description: 'Find the second highest salary from the employees table. Return a single column called second_highest_salary.',
    scenario: 'Finance department needs the second highest earner for benchmarking.',
    schema: 'employees (emp_id, name, salary)',
    base_table_data: [{
      tableName: 'employees',
      columns: [
        { name: 'emp_id', type: 'INT', isPrimaryKey: true },
        { name: 'name', type: 'VARCHAR' },
        { name: 'salary', type: 'DECIMAL' }
      ],
      rows: [[1,'Alice',90000],[2,'Bob',75000],[3,'Charlie',85000],[4,'Diana',70000],[5,'Eve',80000]]
    }],
    test_cases: [
      {
        id: 1, name: 'Sample Test', description: 'Five employees, distinct salaries', isHidden: false, points: 10,
        tableData: [{
          tableName: 'employees',
          columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'salary', type: 'DECIMAL' }],
          rows: [[1,'Alice',90000],[2,'Bob',75000],[3,'Charlie',85000],[4,'Diana',70000],[5,'Eve',80000]]
        }],
        expectedOutput: [[85000]],
        expectedColumns: ['second_highest_salary']
      },
      {
        id: 2, name: 'Test Case 2', description: 'Two employees only', isHidden: false, points: 10,
        tableData: [{
          tableName: 'employees',
          columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'salary', type: 'DECIMAL' }],
          rows: [[1,'X',100000],[2,'Y',60000]]
        }],
        expectedOutput: [[60000]],
        expectedColumns: ['second_highest_salary']
      },
      {
        id: 3, name: 'Hidden Test', isHidden: true, points: 10,
        tableData: [{
          tableName: 'employees',
          columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }, { name: 'salary', type: 'DECIMAL' }],
          rows: [[1,'A',50000],[2,'B',50000],[3,'C',40000]]
        }],
        expectedOutput: [[40000]],
        expectedColumns: ['second_highest_salary']
      }
    ],
    expected_keywords: ['select','from','employees','max','salary','where','not in','subquery'],
    total_points: 30,
    time_limit: 360,
    is_active: true
  },

  // ─── HARD 2 ───────────────────────────────────────────────────────────────
  {
    difficulty: 'hard',
    title: 'Employees Without Orders',
    description: 'Find all employees who have never placed an order. Return emp_id and name.',
    scenario: 'The sales team wants to follow up with employees who have never ordered anything.',
    schema: 'employees (emp_id, name), orders (order_id, emp_id, amount)',
    base_table_data: [
      {
        tableName: 'employees',
        columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }],
        rows: [[1,'Alice'],[2,'Bob'],[3,'Charlie'],[4,'Diana']]
      },
      {
        tableName: 'orders',
        columns: [{ name: 'order_id', type: 'INT', isPrimaryKey: true }, { name: 'emp_id', type: 'INT', isForeignKey: true }, { name: 'amount', type: 'DECIMAL' }],
        rows: [[1,1,500],[2,3,800]]
      }
    ],
    test_cases: [
      {
        id: 1, name: 'Sample Test', description: '4 employees, 2 have orders', isHidden: false, points: 10,
        tableData: [
          {
            tableName: 'employees',
            columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }],
            rows: [[1,'Alice'],[2,'Bob'],[3,'Charlie'],[4,'Diana']]
          },
          {
            tableName: 'orders',
            columns: [{ name: 'order_id', type: 'INT', isPrimaryKey: true }, { name: 'emp_id', type: 'INT', isForeignKey: true }, { name: 'amount', type: 'DECIMAL' }],
            rows: [[1,1,500],[2,3,800]]
          }
        ],
        expectedOutput: [[2,'Bob'],[4,'Diana']],
        expectedColumns: ['emp_id','name']
      },
      {
        id: 2, name: 'Test Case 2', description: 'All have orders', isHidden: false, points: 10,
        tableData: [
          {
            tableName: 'employees',
            columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }],
            rows: [[1,'X'],[2,'Y']]
          },
          {
            tableName: 'orders',
            columns: [{ name: 'order_id', type: 'INT', isPrimaryKey: true }, { name: 'emp_id', type: 'INT', isForeignKey: true }, { name: 'amount', type: 'DECIMAL' }],
            rows: [[1,1,100],[2,2,200]]
          }
        ],
        expectedOutput: [],
        expectedColumns: ['emp_id','name']
      },
      {
        id: 3, name: 'Hidden Test', isHidden: true, points: 10,
        tableData: [
          {
            tableName: 'employees',
            columns: [{ name: 'emp_id', type: 'INT', isPrimaryKey: true }, { name: 'name', type: 'VARCHAR' }],
            rows: [[1,'P'],[2,'Q'],[3,'R']]
          },
          {
            tableName: 'orders',
            columns: [{ name: 'order_id', type: 'INT', isPrimaryKey: true }, { name: 'emp_id', type: 'INT', isForeignKey: true }, { name: 'amount', type: 'DECIMAL' }],
            rows: [[1,2,300]]
          }
        ],
        expectedOutput: [[1,'P'],[3,'R']],
        expectedColumns: ['emp_id','name']
      }
    ],
    expected_keywords: ['select','from','employees','not in','left join','where','null','orders'],
    total_points: 30,
    time_limit: 360,
    is_active: true
  }
]

async function seed() {
  console.log('Clearing existing round2_challenges...')
  const { error: deleteError } = await supabase
    .from('round2_challenges')
    .delete()
    .neq('id', 0) // delete all rows

  if (deleteError) {
    console.error('Failed to clear existing challenges:', deleteError.message)
    process.exit(1)
  }

  console.log('Inserting round2_challenges...')
  const { data, error } = await supabase
    .from('round2_challenges')
    .insert(round2Challenges)
    .select()

  if (error) {
    console.error('Failed to insert challenges:', error.message)
    process.exit(1)
  }

  console.log(`Successfully inserted ${data.length} round 2 challenges:`)
  data.forEach(row => console.log(`  [${row.id}] (${row.difficulty}) ${row.title}`))
}

seed()
