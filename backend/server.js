// backend/server.js
// Rodar com: node backend/server.js

const express = require('express');
const cors    = require('cors');
const Database = require('better-sqlite3');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database(path.join(__dirname, 'database.db'));
db.pragma('journal_mode = WAL');

// ── GET /casos ─────────────────────────────────────────────────
app.get('/casos', (req, res) => {
  const casos = db.prepare(
    'SELECT id, titulo, descricao, cidade, estado FROM casos WHERE ativo = 1 ORDER BY id'
  ).all();
  res.json(casos);
});

// ── GET /casos/:id ─────────────────────────────────────────────
app.get('/casos/:id', (req, res) => {
  const caso = db.prepare('SELECT * FROM casos WHERE id = ?').get(req.params.id);
  if (!caso) return res.status(404).json({ error: 'Caso não encontrado' });
  res.json(caso);
});

// ── GET /casos/:id/suspeitos ───────────────────────────────────
app.get('/casos/:id/suspeitos', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM suspeitos WHERE caso_id = ? ORDER BY id_suspeito'
  ).all(req.params.id);
  res.json(rows);
});

// ── GET /casos/:id/locais ──────────────────────────────────────
app.get('/casos/:id/locais', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM locais WHERE caso_id = ? ORDER BY id_local'
  ).all(req.params.id);
  res.json(rows);
});

// ── GET /casos/:id/pistas ──────────────────────────────────────
// Retorna as pistas SEM a query_sql (segurança — só o backend executa)
app.get('/casos/:id/pistas', (req, res) => {
  const rows = db.prepare(
    'SELECT id, caso_id, numero, titulo, enunciado, acao_detetive, conceito_bd, tabela_alvo FROM pistas WHERE caso_id = ? ORDER BY numero'
  ).all(req.params.id);
  res.json(rows);
});

// ── POST /pistas/:id/consultar ─────────────────────────────────
// Executa a query SQL da pista e registra o log
app.post('/pistas/:id/consultar', (req, res) => {
  const { sessao_id, caso_id } = req.body;

  if (!sessao_id || !caso_id) {
    return res.status(400).json({ error: 'sessao_id e caso_id são obrigatórios' });
  }

  // Busca a pista com a query
  const pista = db.prepare('SELECT * FROM pistas WHERE id = ?').get(req.params.id);
  if (!pista) return res.status(404).json({ error: 'Pista não encontrada' });

  // Segurança: garante que a pista pertence ao caso
  if (pista.caso_id !== parseInt(caso_id)) {
    return res.status(403).json({ error: 'Pista não pertence a este caso' });
  }

  // Segurança: só permite SELECT
  const query = pista.query_sql.trim();
  if (!query.toUpperCase().startsWith('SELECT')) {
    return res.status(403).json({ error: 'Apenas consultas SELECT são permitidas' });
  }

  try {
    // Executa a query SQL real
    const rows = db.prepare(query).all();
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    // Registra o log
    db.prepare(
      'INSERT INTO logs_acao (caso_id, sessao_id, pista_id, acao) VALUES (?, ?, ?, ?)'
    ).run(caso_id, sessao_id, pista.id, 'consultar_pista');

    res.json({ rows, columns, conceito_bd: pista.conceito_bd });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao executar consulta: ' + err.message });
  }
});

// ── POST /casos/:id/acusar ─────────────────────────────────────
app.post('/casos/:id/acusar', (req, res) => {
  const { sessao_id, suspeito_id, local_id } = req.body;
  const caso = db.prepare('SELECT * FROM casos WHERE id = ?').get(req.params.id);
  if (!caso) return res.status(404).json({ error: 'Caso não encontrado' });

  const acertouSuspeito = parseInt(suspeito_id) === caso.culpado_id;
  const acertouLocal    = parseInt(local_id) === caso.esconderijo_id;
  const acerto          = acertouSuspeito && acertouLocal;

  db.prepare(
    'INSERT INTO logs_acao (caso_id, sessao_id, acao, acerto) VALUES (?, ?, ?, ?)'
  ).run(caso.id, sessao_id, 'acusar', acerto ? 1 : 0);

  res.json({ acerto, acertouSuspeito, acertouLocal });
});

// ── POST /logs ─────────────────────────────────────────────────
app.post('/logs', (req, res) => {
  const { caso_id, sessao_id, acao } = req.body;
  db.prepare(
    'INSERT INTO logs_acao (caso_id, sessao_id, acao) VALUES (?, ?, ?)'
  ).run(caso_id, sessao_id, acao);
  res.json({ ok: true });
});

// ── GET /admin/logs/:caso_id ───────────────────────────────────
app.get('/admin/logs/:caso_id', (req, res) => {
  const logs = db.prepare(`
    SELECT l.*, p.titulo as pista_titulo, p.conceito_bd
    FROM logs_acao l
    LEFT JOIN pistas p ON p.id = l.pista_id
    WHERE l.caso_id = ?
    ORDER BY l.criado_em DESC
    LIMIT 200
  `).all(req.params.caso_id);

  const sessoes = new Set(logs.map(l => l.sessao_id)).size;
  const acusacoes = logs.filter(l => l.acao === 'acusar');
  const acertos   = acusacoes.filter(l => l.acerto === 1).length;

  const porPista = {};
  logs.filter(l => l.pista_id).forEach(l => {
    const k = l.pista_titulo || l.pista_id;
    porPista[k] = (porPista[k] || 0) + 1;
  });

  res.json({ logs, stats: { sessoes, acusacoes: acusacoes.length, acertos, porPista } });
});

// ── Admin: CRUD ────────────────────────────────────────────────
app.post('/admin/casos', (req, res) => {
  const { titulo, descricao, cidade, estado, culpado_id, esconderijo_id } = req.body;
  const r = db.prepare(
    'INSERT INTO casos (titulo, descricao, cidade, estado, culpado_id, esconderijo_id) VALUES (?,?,?,?,?,?)'
  ).run(titulo, descricao, cidade, estado, culpado_id || null, esconderijo_id || null);
  res.json({ id: r.lastInsertRowid });
});

app.patch('/admin/casos/:id', (req, res) => {
  db.prepare('UPDATE casos SET ativo = ? WHERE id = ?').run(req.body.ativo ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

app.post('/admin/suspeitos', (req, res) => {
  const f = req.body;
  const r = db.prepare(`
    INSERT INTO suspeitos (caso_id,id_suspeito,nome,idade,altura_m,peso_kg,cor_olhos,nacionalidade,naturalidade_cidade,naturalidade_estado,historico,habilidades,motivo_suspeita)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(f.caso_id,f.id_suspeito,f.nome,f.idade||null,f.altura_m||null,f.peso_kg||null,f.cor_olhos,f.nacionalidade,f.naturalidade_cidade,f.naturalidade_estado,f.historico,f.habilidades,f.motivo_suspeita);
  res.json({ id: r.lastInsertRowid });
});

app.post('/admin/locais', (req, res) => {
  const f = req.body;
  const r = db.prepare(`
    INSERT INTO locais (caso_id,id_local,nome_comodo,andar,setor,nivel_acesso,caracteristica_marcante,descricao)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(f.caso_id,f.id_local,f.nome_comodo,f.andar||null,f.setor||null,f.nivel_acesso,f.caracteristica_marcante||null,f.descricao||null);
  res.json({ id: r.lastInsertRowid });
});

app.post('/admin/pistas', (req, res) => {
  const f = req.body;
  const r = db.prepare(`
    INSERT INTO pistas (caso_id,numero,titulo,enunciado,acao_detetive,conceito_bd,tabela_alvo,query_sql)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(f.caso_id,f.numero,f.titulo,f.enunciado,f.acao_detetive,f.conceito_bd,f.tabela_alvo,f.query_sql);
  res.json({ id: r.lastInsertRowid });
});

// ── Start ──────────────────────────────────────────────────────
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🔍 Detetives de Dados — servidor rodando em http://localhost:${PORT}`);
  console.log('   Pressione Ctrl+C para parar.');
});
