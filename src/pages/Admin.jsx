import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCasos, getCaso, getLogs, criarCaso, toggleCaso, criarSuspeito, criarLocal, criarPista } from '../lib/api'

const ABAS = ['Casos', 'Suspeitos', 'Locais', 'Pistas', 'Logs']

export default function Admin() {
  const [aba, setAba] = useState('Casos')
  const navigate = useNavigate()

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>
          ← Voltar ao jogo
        </button>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--purple-l)' }}>
          Painel de Administração
        </h1>
        <p className="text-sm text-muted">Cadastre e gerencie os casos do jogo.</p>
      </div>

      <div className="flex gap-1" style={{ borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {ABAS.map(a => (
          <button key={a} onClick={() => setAba(a)} className="btn btn-ghost"
            style={{
              borderBottom: aba === a ? '2px solid var(--purple)' : '2px solid transparent',
              borderRadius: '8px 8px 0 0',
              color: aba === a ? 'var(--purple-l)' : 'var(--muted)'
            }}>
            {a}
          </button>
        ))}
      </div>

      {aba === 'Casos'     && <GerenciarCasos />}
      {aba === 'Suspeitos' && <GerenciarSuspeitos />}
      {aba === 'Locais'    && <GerenciarLocais />}
      {aba === 'Pistas'    && <GerenciarPistas />}
      {aba === 'Logs'      && <VerLogs />}
    </div>
  )
}

function GerenciarCasos() {
  const [casos, setCasos] = useState([])
  const [form, setForm] = useState({ titulo:'', descricao:'', cidade:'', estado:'', culpado_id:'', esconderijo_id:'' })
  const [msg, setMsg] = useState('')

  useEffect(() => { getCasos().then(setCasos) }, [])

  async function salvar() {
    await criarCaso(form)
    setMsg('Caso criado!')
    setForm({ titulo:'', descricao:'', cidade:'', estado:'', culpado_id:'', esconderijo_id:'' })
    getCasos().then(setCasos)
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1rem', fontWeight: 600 }}>Casos cadastrados</h2>
      <div style={{ display: 'grid', gap: '.75rem', marginBottom: '2rem' }}>
        {casos.map(c => (
          <div key={c.id} className="card">
            <div className="flex items-c justify-b">
              <div>
                <span className="badge badge-purple" style={{ marginRight: '.5rem' }}>#{c.id}</span>
                <strong>{c.titulo}</strong>
                <span className="text-muted text-sm" style={{ marginLeft: '.75rem' }}>{c.cidade}, {c.estado}</span>
              </div>
              <button className="btn btn-ghost" style={{ fontSize: '12px' }}
                onClick={() => toggleCaso(c.id, !c.ativo).then(() => getCasos().then(setCasos))}>
                {c.ativo ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginBottom: '1rem', fontWeight: 600 }}>Novo caso</h2>
      <div style={{ display: 'grid', gap: '.75rem', maxWidth: '600px' }}>
        <Inp label="Título" value={form.titulo} onChange={v => setForm(f => ({ ...f, titulo: v }))} />
        <Inp label="Descrição" value={form.descricao} onChange={v => setForm(f => ({ ...f, descricao: v }))} textarea />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          <Inp label="Cidade" value={form.cidade} onChange={v => setForm(f => ({ ...f, cidade: v }))} />
          <Inp label="Estado (UF)" value={form.estado} onChange={v => setForm(f => ({ ...f, estado: v }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
          <Inp label="ID do culpado" value={form.culpado_id} onChange={v => setForm(f => ({ ...f, culpado_id: v }))} />
          <Inp label="ID do esconderijo" value={form.esconderijo_id} onChange={v => setForm(f => ({ ...f, esconderijo_id: v }))} />
        </div>
        {msg && <p style={{ color: 'var(--teal)', fontSize: '13px' }}>{msg}</p>}
        <button className="btn btn-primary" onClick={salvar} disabled={!form.titulo}>+ Criar caso</button>
      </div>
    </div>
  )
}

function GerenciarSuspeitos() {
  const [casos, setCasos] = useState([])
  const [form, setForm] = useState({ caso_id:'', id_suspeito:'', nome:'', idade:'', altura_m:'', peso_kg:'', cor_olhos:'', naturalidade_cidade:'', naturalidade_estado:'', historico:'', habilidades:'', motivo_suspeita:'' })
  const [msg, setMsg] = useState('')

  useEffect(() => { getCasos().then(setCasos) }, [])

  async function salvar() {
    await criarSuspeito(form)
    setMsg('Suspeito adicionado!')
    setForm(f => ({ ...f, id_suspeito:'', nome:'', idade:'', altura_m:'', peso_kg:'', cor_olhos:'', naturalidade_cidade:'', naturalidade_estado:'', historico:'', habilidades:'', motivo_suspeita:'' }))
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1rem', fontWeight: 600 }}>Adicionar suspeito</h2>
      <div style={{ display: 'grid', gap: '.75rem', maxWidth: '600px' }}>
        <div>
          <label className="text-sm text-muted" style={{ display:'block', marginBottom:'.4rem' }}>Caso</label>
          <select className="acusacao-select" value={form.caso_id} onChange={e => setForm(f => ({ ...f, caso_id: e.target.value }))}>
            <option value="">Selecione...</option>
            {casos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
          <Inp label="ID narrativo" value={form.id_suspeito} onChange={v => setForm(f=>({...f,id_suspeito:v}))} />
          <Inp label="Nome" value={form.nome} onChange={v => setForm(f=>({...f,nome:v}))} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'.75rem' }}>
          <Inp label="Idade" value={form.idade} onChange={v => setForm(f=>({...f,idade:v}))} />
          <Inp label="Altura (m)" value={form.altura_m} onChange={v => setForm(f=>({...f,altura_m:v}))} />
          <Inp label="Peso (kg)" value={form.peso_kg} onChange={v => setForm(f=>({...f,peso_kg:v}))} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'.75rem' }}>
          <Inp label="Cor dos olhos" value={form.cor_olhos} onChange={v => setForm(f=>({...f,cor_olhos:v}))} />
          <Inp label="Cidade natal" value={form.naturalidade_cidade} onChange={v => setForm(f=>({...f,naturalidade_cidade:v}))} />
          <Inp label="Estado (UF)" value={form.naturalidade_estado} onChange={v => setForm(f=>({...f,naturalidade_estado:v}))} />
        </div>
        <Inp label="Histórico" value={form.historico} onChange={v => setForm(f=>({...f,historico:v}))} textarea />
        <Inp label="Habilidades" value={form.habilidades} onChange={v => setForm(f=>({...f,habilidades:v}))} textarea />
        <Inp label="Motivo da suspeita" value={form.motivo_suspeita} onChange={v => setForm(f=>({...f,motivo_suspeita:v}))} textarea />
        {msg && <p style={{ color:'var(--teal)', fontSize:'13px' }}>{msg}</p>}
        <button className="btn btn-primary" onClick={salvar} disabled={!form.nome || !form.caso_id}>+ Adicionar suspeito</button>
      </div>
    </div>
  )
}

function GerenciarLocais() {
  const [casos, setCasos] = useState([])
  const [form, setForm] = useState({ caso_id:'', id_local:'', nome_comodo:'', andar:'', setor:'', nivel_acesso:'Público', caracteristica_marcante:'', descricao:'' })
  const [msg, setMsg] = useState('')

  useEffect(() => { getCasos().then(setCasos) }, [])

  async function salvar() {
    await criarLocal(form)
    setMsg('Local criado!')
    setForm(f => ({ ...f, id_local:'', nome_comodo:'', andar:'', setor:'', caracteristica_marcante:'', descricao:'' }))
  }

  return (
    <div>
      <h2 style={{ marginBottom:'1rem', fontWeight:600 }}>Adicionar local</h2>
      <div style={{ display:'grid', gap:'.75rem', maxWidth:'600px' }}>
        <div>
          <label className="text-sm text-muted" style={{ display:'block', marginBottom:'.4rem' }}>Caso</label>
          <select className="acusacao-select" value={form.caso_id} onChange={e => setForm(f=>({...f,caso_id:e.target.value}))}>
            <option value="">Selecione...</option>
            {casos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
          </select>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'.75rem' }}>
          <Inp label="ID narrativo" value={form.id_local} onChange={v=>setForm(f=>({...f,id_local:v}))} />
          <Inp label="Nome do cômodo" value={form.nome_comodo} onChange={v=>setForm(f=>({...f,nome_comodo:v}))} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'.75rem' }}>
          <Inp label="Andar" value={form.andar} onChange={v=>setForm(f=>({...f,andar:v}))} />
          <Inp label="Setor" value={form.setor} onChange={v=>setForm(f=>({...f,setor:v}))} />
          <div>
            <label className="text-sm text-muted" style={{ display:'block', marginBottom:'.4rem' }}>Nível de acesso</label>
            <select className="acusacao-select" value={form.nivel_acesso} onChange={e=>setForm(f=>({...f,nivel_acesso:e.target.value}))}>
              <option>Público</option><option>Padrão</option><option>Restrito</option><option>Super Restrito</option>
            </select>
          </div>
        </div>
        <Inp label="Característica marcante" value={form.caracteristica_marcante} onChange={v=>setForm(f=>({...f,caracteristica_marcante:v}))} />
        <Inp label="Descrição" value={form.descricao} onChange={v=>setForm(f=>({...f,descricao:v}))} textarea />
        {msg && <p style={{ color:'var(--teal)', fontSize:'13px' }}>{msg}</p>}
        <button className="btn btn-primary" onClick={salvar} disabled={!form.nome_comodo || !form.caso_id}>+ Adicionar local</button>
      </div>
    </div>
  )
}

function GerenciarPistas() {
  const [casos, setCasos] = useState([])
  const [form, setForm] = useState({ caso_id:'', numero:'', titulo:'', enunciado:'', acao_detetive:'', conceito_bd:'WHERE texto', tabela_alvo:'suspeitos', query_sql:'' })
  const [msg, setMsg] = useState('')
  const CONCEITOS = ['WHERE texto','WHERE numérico','WHERE comparação','AND','OR','LIKE','JOIN','Chave estrangeira narrativa']

  useEffect(() => { getCasos().then(setCasos) }, [])

  async function salvar() {
    await criarPista(form)
    setMsg('Pista criada!')
    setForm(f => ({ ...f, numero:'', titulo:'', enunciado:'', acao_detetive:'', query_sql:'' }))
  }

  return (
    <div>
      <h2 style={{ marginBottom:'1rem', fontWeight:600 }}>Adicionar pista</h2>
      <div style={{ display:'grid', gap:'.75rem', maxWidth:'650px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'.75rem' }}>
          <div>
            <label className="text-sm text-muted" style={{ display:'block', marginBottom:'.4rem' }}>Caso</label>
            <select className="acusacao-select" value={form.caso_id} onChange={e=>setForm(f=>({...f,caso_id:e.target.value}))}>
              <option value="">Selecione...</option>
              {casos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
            </select>
          </div>
          <Inp label="Número" value={form.numero} onChange={v=>setForm(f=>({...f,numero:v}))} />
        </div>
        <Inp label="Título" value={form.titulo} onChange={v=>setForm(f=>({...f,titulo:v}))} />
        <Inp label="Enunciado (texto para a jogadora)" value={form.enunciado} onChange={v=>setForm(f=>({...f,enunciado:v}))} textarea />
        <Inp label="O que o detetive deve concluir" value={form.acao_detetive} onChange={v=>setForm(f=>({...f,acao_detetive:v}))} textarea />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
          <div>
            <label className="text-sm text-muted" style={{ display:'block', marginBottom:'.4rem' }}>Conceito de BD</label>
            <select className="acusacao-select" value={form.conceito_bd} onChange={e=>setForm(f=>({...f,conceito_bd:e.target.value}))}>
              {CONCEITOS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted" style={{ display:'block', marginBottom:'.4rem' }}>Tabela alvo</label>
            <select className="acusacao-select" value={form.tabela_alvo} onChange={e=>setForm(f=>({...f,tabela_alvo:e.target.value}))}>
              <option>suspeitos</option><option>locais</option><option>itens</option>
            </select>
          </div>
        </div>
        <Inp label="Query SQL" value={form.query_sql} onChange={v=>setForm(f=>({...f,query_sql:v}))} textarea mono />
        {msg && <p style={{ color:'var(--teal)', fontSize:'13px' }}>{msg}</p>}
        <button className="btn btn-primary" onClick={salvar} disabled={!form.titulo || !form.query_sql || !form.caso_id}>+ Criar pista</button>
      </div>
    </div>
  )
}

function VerLogs() {
  const [casos, setCasos] = useState([])
  const [casoSel, setCasoSel] = useState('')
  const [dados, setDados] = useState(null)

  useEffect(() => { getCasos().then(setCasos) }, [])
  useEffect(() => {
    if (!casoSel) return
    getLogs(casoSel).then(setDados)
  }, [casoSel])

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <label className="text-sm text-muted" style={{ display:'block', marginBottom:'.4rem' }}>Selecionar caso</label>
        <select className="acusacao-select" style={{ maxWidth:'300px' }} value={casoSel} onChange={e => setCasoSel(e.target.value)}>
          <option value="">Selecione...</option>
          {casos.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
        </select>
      </div>

      {dados?.stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
          {[
            { label:'Sessões únicas',       valor: dados.stats.sessoes,    color:'var(--purple-l)' },
            { label:'Acusações feitas',     valor: dados.stats.acusacoes,  color:'var(--amber)' },
            { label:'Acusações corretas',   valor: dados.stats.acertos,    color:'var(--teal)' },
            { label:'Taxa de acerto',       valor: dados.stats.acusacoes ? `${Math.round(dados.stats.acertos/dados.stats.acusacoes*100)}%` : '—', color:'var(--teal)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign:'center' }}>
              <div style={{ fontSize:'2rem', fontWeight:700, color:s.color }}>{s.valor}</div>
              <div className="text-sm text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {dados?.stats?.porPista && Object.keys(dados.stats.porPista).length > 0 && (
        <div style={{ marginBottom:'2rem' }}>
          <h3 style={{ marginBottom:'.75rem', fontWeight:600 }}>Pistas mais consultadas</h3>
          {Object.entries(dados.stats.porPista).sort((a,b)=>b[1]-a[1]).map(([pista,count]) => (
            <div key={pista} className="card" style={{ padding:'.75rem 1rem', marginBottom:'.5rem' }}>
              <div className="flex items-c justify-b">
                <span className="text-sm">{pista}</span>
                <span className="badge badge-purple">{count}x</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {dados?.logs?.slice(0,50).map(l => (
        <div key={l.id} className="card" style={{ padding:'.75rem 1rem', marginBottom:'.4rem' }}>
          <div className="flex items-c gap-1" style={{ flexWrap:'wrap' }}>
            <span className={`badge ${l.acao === 'acusar' ? (l.acerto ? 'badge-teal' : 'badge-amber') : 'badge-purple'}`}>{l.acao}</span>
            <span className="text-sm text-muted">sessão {l.sessao_id?.slice(0,8)}...</span>
            {l.pista_titulo && <span className="text-sm">→ {l.pista_titulo}</span>}
            {l.acao === 'acusar' && <span className="text-sm" style={{ color: l.acerto ? 'var(--teal)' : 'var(--red)' }}>{l.acerto ? '✓ correto' : '✗ errado'}</span>}
            <span className="text-sm text-muted" style={{ marginLeft:'auto' }}>{new Date(l.criado_em).toLocaleTimeString('pt-BR')}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function Inp({ label, value, onChange, textarea, mono }) {
  const style = {
    width:'100%', padding:'.7rem 1rem',
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:'8px', color:'var(--text)', fontSize:'14px',
    fontFamily: mono ? "'Fira Code',monospace" : 'inherit',
    resize: textarea ? 'vertical' : undefined,
  }
  return (
    <div>
      <label className="text-sm text-muted" style={{ display:'block', marginBottom:'.4rem' }}>{label}</label>
      {textarea
        ? <textarea style={style} rows={3} value={value} onChange={e => onChange(e.target.value)} />
        : <input style={style} value={value} onChange={e => onChange(e.target.value)} />
      }
    </div>
  )
}
