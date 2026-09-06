const Database = require("better-sqlite3");
const path = require("path");

// ==========================================
// DATABASE
// ==========================================

const dbPath = path.join(__dirname, "database.sqlite");

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

// ==========================================
// USERS
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// ==========================================
// TAILOR ORDERS
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS tailor_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    order_id TEXT NOT NULL,
    date TEXT,

    customer_name TEXT,
    dress_name TEXT NOT NULL,
    dress_type TEXT DEFAULT 'Blouse',

    quantity REAL DEFAULT 1,
    stitching_amount REAL DEFAULT 0,

    lining_name TEXT,
    lining_color TEXT,
    lining_used REAL DEFAULT 0,

    status TEXT DEFAULT 'Given to Tailor',

    notes TEXT,
    completed_date TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );
`);

// ==========================================
// MONTHLY RECORDS
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS monthly_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    order_id TEXT NOT NULL,

    date TEXT,
    customer_name TEXT,

    dress_name TEXT NOT NULL,
    dress_type TEXT DEFAULT 'Blouse',

    quantity REAL DEFAULT 1,
    stitching_amount REAL DEFAULT 0,

    lining_name TEXT,
    lining_color TEXT,
    lining_used REAL DEFAULT 0,

    status TEXT DEFAULT 'Completed',

    notes TEXT,
    completed_date TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );
`);

// ==========================================
// LINING STOCK
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS lining_stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    stock_id TEXT,

    lining_name TEXT NOT NULL,

    colour TEXT NOT NULL,

    quantity REAL DEFAULT 0,

    price_per_meter REAL DEFAULT 0,

    purchase_date TEXT,

    notes TEXT DEFAULT '',

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );
`);

// ==========================================
// LINING SOLD
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS lining_sold (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    sale_id TEXT NOT NULL,

    stock_id INTEGER,

    lining_name TEXT NOT NULL,

    colour TEXT NOT NULL,

    quantity REAL DEFAULT 0,

    price_per_meter REAL DEFAULT 0,

    sale_amount REAL DEFAULT 0,

    sale_date TEXT,

    customer_name TEXT DEFAULT '',

    notes TEXT DEFAULT '',

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );
`);

// ==========================================
// ADD MISSING COLUMN HELPER
// ==========================================

function addColumnIfMissing(table, column, definition) {
  const columns = db
    .prepare(`PRAGMA table_info(${table})`)
    .all();

  const exists = columns.some(
    (item) => item.name === column
  );

  if (!exists) {
    db.exec(`
      ALTER TABLE ${table}
      ADD COLUMN ${column} ${definition}
    `);

    console.log(
      `Added column: ${table}.${column}`
    );
  }
}

// ==========================================
// TAILOR ORDERS MIGRATION
// ==========================================

addColumnIfMissing(
  "tailor_orders",
  "dress_type",
  "TEXT DEFAULT 'Blouse'"
);

addColumnIfMissing(
  "tailor_orders",
  "notes",
  "TEXT DEFAULT ''"
);

addColumnIfMissing(
  "tailor_orders",
  "completed_date",
  "TEXT"
);

// ==========================================
// MONTHLY RECORDS MIGRATION
// ==========================================

addColumnIfMissing(
  "monthly_records",
  "dress_type",
  "TEXT DEFAULT 'Blouse'"
);

addColumnIfMissing(
  "monthly_records",
  "notes",
  "TEXT DEFAULT ''"
);

addColumnIfMissing(
  "monthly_records",
  "completed_date",
  "TEXT"
);

// ==========================================
// LINING STOCK MIGRATION
// ==========================================

// Add colour column if old database has color
addColumnIfMissing(
  "lining_stock",
  "colour",
  "TEXT DEFAULT ''"
);

addColumnIfMissing(
  "lining_stock",
  "stock_id",
  "TEXT"
);

addColumnIfMissing(
  "lining_stock",
  "price_per_meter",
  "REAL DEFAULT 0"
);

addColumnIfMissing(
  "lining_stock",
  "purchase_date",
  "TEXT"
);

addColumnIfMissing(
  "lining_stock",
  "notes",
  "TEXT DEFAULT ''"
);

// Copy old color values into new colour column
try {
  db.prepare(`
    UPDATE lining_stock
    SET colour = color
    WHERE (colour IS NULL OR colour = '')
    AND color IS NOT NULL
  `).run();
} catch (error) {
  // Old color column may not exist.
}

// ==========================================
// LINING SOLD MIGRATION
// ==========================================

addColumnIfMissing(
  "lining_sold",
  "stock_id",
  "INTEGER"
);

addColumnIfMissing(
  "lining_sold",
  "colour",
  "TEXT DEFAULT ''"
);

addColumnIfMissing(
  "lining_sold",
  "price_per_meter",
  "REAL DEFAULT 0"
);

addColumnIfMissing(
  "lining_sold",
  "sale_amount",
  "REAL DEFAULT 0"
);

addColumnIfMissing(
  "lining_sold",
  "sale_date",
  "TEXT"
);

addColumnIfMissing(
  "lining_sold",
  "customer_name",
  "TEXT DEFAULT ''"
);

addColumnIfMissing(
  "lining_sold",
  "notes",
  "TEXT DEFAULT ''"
);

// Copy old color → colour
try {
  db.prepare(`
    UPDATE lining_sold
    SET colour = color
    WHERE (colour IS NULL OR colour = '')
    AND color IS NOT NULL
  `).run();
} catch (error) {
  // Old color column may not exist.
}

// Copy old amount → sale_amount
try {
  db.prepare(`
    UPDATE lining_sold
    SET sale_amount = amount
    WHERE (sale_amount IS NULL OR sale_amount = 0)
    AND amount IS NOT NULL
  `).run();
} catch (error) {
  // Old amount column may not exist.
}

// Copy old date → sale_date
try {
  db.prepare(`
    UPDATE lining_sold
    SET sale_date = date
    WHERE (sale_date IS NULL OR sale_date = '')
    AND date IS NOT NULL
  `).run();
} catch (error) {
  // Old date column may not exist.
}

// ==========================================
// INDEXES
// ==========================================

db.exec(`
  CREATE INDEX IF NOT EXISTS
  idx_tailor_orders_user
  ON tailor_orders(user_id);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS
  idx_monthly_records_user
  ON monthly_records(user_id);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS
  idx_lining_stock_user
  ON lining_stock(user_id);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS
  idx_lining_sold_user
  ON lining_sold(user_id);
`);

// ==========================================
// SUCCESS
// ==========================================

console.log("=================================");
console.log("SQLite Database Connected");
console.log("Database:", dbPath);
console.log("All tables are ready");
console.log("=================================");

module.exports = db;