import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, '../../data/short_drama.db')

// Ensure data directory exists
import { mkdirSync } from 'fs'
mkdirSync(join(__dirname, '../../data'), { recursive: true })

const db = new Database(dbPath)

export function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT,
      nickname TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      balance REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Dramas table
  db.exec(`
    CREATE TABLE IF NOT EXISTS dramas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      cover TEXT,
      description TEXT,
      category TEXT DEFAULT 'other',
      price REAL DEFAULT 0,
      total_episodes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Episodes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drama_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      video_url TEXT,
      duration INTEGER DEFAULT 0,
      episode_number INTEGER NOT NULL,
      is_free INTEGER DEFAULT 0,
      FOREIGN KEY (drama_id) REFERENCES dramas(id)
    )
  `)

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      drama_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      paid_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (drama_id) REFERENCES dramas(id)
    )
  `)

  // User drama purchases (for tracking which dramas a user has bought)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      drama_id INTEGER NOT NULL,
      purchased_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, drama_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (drama_id) REFERENCES dramas(id)
    )
  `)

  // Admins table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Sign-in rules table
  db.exec(`
    CREATE TABLE IF NOT EXISTS signin_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      daily_reward INTEGER DEFAULT 10,
      continuous_day_bonus INTEGER DEFAULT 5,
      bonus_per_days TEXT DEFAULT '[]',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Sign-in records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS signin_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      signin_date TEXT NOT NULL,
      reward_amount INTEGER DEFAULT 10,
      continuous_days INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, signin_date)
    )
  `)

  // Add status column to dramas if not exists
  try {
    db.exec(`ALTER TABLE dramas ADD COLUMN status INTEGER DEFAULT 1`)
  } catch (e: any) {
    if (!e.message.includes('duplicate column')) console.log(' dramas status column already exists')
  }

  // Add status column to users if not exists
  try {
    db.exec(`ALTER TABLE users ADD COLUMN status INTEGER DEFAULT 1`)
  } catch (e: any) {
    if (!e.message.includes('duplicate column')) console.log(' users status column already exists')
  }

  // Seed data if empty
  const dramaCount = db.prepare('SELECT COUNT(*) as count FROM dramas').get() as { count: number }
  
  if (dramaCount.count === 0) {
    seedData()
  }

  console.log('Database initialized successfully')
}

function seedData() {
  // Insert sample dramas
  const insertDrama = db.prepare(`
    INSERT INTO dramas (title, cover, description, category, price, total_episodes)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const dramas = [
    ['霸道总裁爱上我', 'https://picsum.photos/400/600', '都市情感剧，讲述霸道总裁与普通女孩的爱情故事', 'urban', 30, 20],
    ['穿越之医手遮天', 'https://picsum.photos/400/601', '古言穿越剧，现代医生穿越到古代成为王妃', 'ancient', 68, 30],
    ['甜蜜暴击', 'https://picsum.photos/400/602', '甜宠喜剧，欢喜冤家的甜蜜日常', 'sweet', 18, 15],
    ['暗夜追凶', 'https://picsum.photos/400/603', '悬疑刑侦剧，揭露惊天大案真相', 'suspense', 88, 25],
    ['重生之嫡女复仇', 'https://picsum.photos/400/604', '古言复仇剧，重生嫡女手撕渣男', 'ancient', 50, 28],
    ['契约婚姻', 'https://picsum.photos/400/605', '都市情感剧，契约婚姻背后的真愛', 'urban', 38, 22]
  ]

  const insertEpisode = db.prepare(`
    INSERT INTO episodes (drama_id, title, video_url, duration, episode_number, is_free)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  for (const drama of dramas) {
    const result = insertDrama.run(...drama)
    const dramaId = result.lastInsertRowid
    
    // Insert episodes for each drama
    const totalEpisodes = drama[5] as number
    for (let i = 1; i <= totalEpisodes; i++) {
      const isFree = i <= 2 ? 1 : 0 // First 2 episodes free
      insertEpisode.run(
        dramaId,
        `第${i}集`,
        `https://vip.lzsdmf.com/20240502/MjA1MzQ4/index.m3u8`,
        Math.floor(Math.random() * 300) + 300,
        i,
        isFree
      )
    }
  }

  // Insert test user
  db.prepare(`
    INSERT INTO users (phone, nickname, balance) VALUES (?, ?, ?)
  `).run('13800138000', '测试用户', 100)

  console.log('Sample data seeded')
}

export default db
