// backend/db.js
// Camada de acesso ao banco — sql.js (SQLite em JS puro, sem compilação)

const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, 'database.db')

let _db = null

async function getDb() {
  if (_db) return _db
  const SQL = await initSqlJs()
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH)
    _db = new SQL.Database(buf)
  } else {
    _db = new SQL.Database()
  }
  return _db
}

function save(db) {
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

// Executa SELECT e retorna array de objetos
function query(db, sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

// Executa INSERT/UPDATE/DELETE
function run(db, sql, params = []) {
  db.run(sql, params)
}

module.exports = { getDb, save, query, run }
