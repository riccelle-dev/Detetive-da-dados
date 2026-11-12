import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCaso, getSuspeitos, getLocais, getPistas, consultarPista, acusar, registrarLog, getSessaoId } from '../lib/api'

const ABAS = ['Pistas', 'Suspeitos', 'Locais', 'Acusar']

export default function Caso() {
  const { id } = useParams()
  const navigate = useNavigate()
  const sessaoId = getSessaoId()

  const [caso, setCaso]           = useState(null)
  const [suspeitos, setSuspeitos] = useState([])
  const [locais, setLocais]       = useState([])
  const [pistas, setPistas]       = useState([])
  const [aba, setAba]             = useState('Pistas')
  const [pistaAberta, setPistaAberta]   = useState(null)
  const [resultados, setResultados]     = useState({})
  const [loadingPista, setLoadingPista] = useState(null)

  const [suspeitoAcus, setSuspeitoAcus] = useState('')
  const [localAcus, setLocalAcus]       = useState('')
  const [resultado, setResultado]       = useState(null)

  useEffect(() => {
    const casoId = parseInt(id)
    Promise.all([getCaso(casoId), getSuspeitos(casoId), getLocais(casoId), getPistas(casoId)])
      .then(([c, s, l, p]) => { setCaso(c); setSuspeitos(s); setLocais(l); setPistas(p) })
    registrarLog(casoId, sessaoId, 'iniciar_caso')
  }, [id])

  async function handleConsultar(pista) {
    setPistaAberta(pista.id)
    if (resultados[pista.id]) return
    setLoadingPista(pista.id)
    try {
      const data = await consultarPista(pista.id, sessaoId, parseInt(id))
      setResultados(r => ({ ...r, [pista.id]: data }))
    } catch (e) {
      setResultados(r => ({ ...r, [pista.id]: { erro: e.message } }))
    }
    setLoadingPista(null)
  }

  async function handleAcusar() {
    if (!suspeitoAcus || !localAcus) return
    const res = await acusar(parseInt(id), sessaoId, suspeitoAcus, localAcus)
    setResultado(res)
  }

  if (!caso) return <div className="container text-muted" style={{ paddingTop: '3rem' }}>Carregando caso...</div>

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>
          ← Voltar
        </button>
        <div className="flex items-c gap-1 mb-1">
          <span className="badge badge-purple">Caso ativo</span>
          <span className="text-muted text-sm">{caso.cidade}, {caso.estado}</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--purple-l)', marginBottom: '.5rem' }}>
          {caso.titulo}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)', maxWidth: '620px', lineHeight: 1.7 }}>
          {caso.descricao}
        </p>
      </div>

      {/* Abas */}
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

      {/* ── PISTAS ── */}
      {aba === 'Pistas' && (
        <div>
          <p className="text-sm text-muted mb-1">
            Clique em uma pista para consultar o banco de dados. Cada pista executa uma query SQL real.
          </p>
          {pistas.map(p => (
            <div key={p.id} className="pista-card">
              <div className="pista-header" onClick={() => handleConsultar(p)}>
                <div className="pista-num">{p.numero}</div>
                <div className="pista-titulo">{p.titulo}</div>
                <span className="conceito-tag">{p.conceito_bd}</span>
                {resultados[p.id] && !resultados[p.id].erro && (
                  <span className="badge badge-teal">✓ Consultada</span>
                )}
              </div>

              {pistaAberta === p.id && (
                <div className="pista-body">
                  <div className="pista-enunciado">{p.enunciado}</div>

                  {loadingPista === p.id && (
                    <p className="text-muted text-sm">Executando consulta no banco...</p>
                  )}

                  {resultados[p.id] && !resultados[p.id].erro && (
                    <>
                      <p className="text-sm text-muted" style={{ marginBottom: '.5rem' }}>
                        Resultado da consulta — tabela <strong>{p.tabela_alvo}</strong>:
                      </p>
                      <TabelaResultado
                        dados={resultados[p.id].rows}
                        colunas={resultados[p.id].columns}
                      />
                      <div style={{ marginTop: '1rem', padding: '1rem', background: '#0e1a16', borderRadius: '8px', borderLeft: '3px solid var(--teal)' }}>
                        <p className="text-sm" style={{ color: 'var(--teal)', fontWeight: 600, marginBottom: '.25rem' }}>
                          O que isso significa:
                        </p>
                        <p className="text-sm">{p.acao_detetive}</p>
                      </div>
                    </>
                  )}

                  {resultados[p.id]?.erro && (
                    <p style={{ color: 'var(--red)', fontSize: '13px' }}>
                      Erro: {resultados[p.id].erro}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── SUSPEITOS ── */}
      {aba === 'Suspeitos' && (
        <div>
          <p className="text-sm text-muted mb-1">
            Fichas dos suspeitos — cada ficha é uma tupla da tabela <strong>suspeitos</strong>.
          </p>
          <div className="fichas-grid">
            {suspeitos.map(s => (
              <div key={s.id} className="ficha">
                <div className="ficha-id">ID: {s.id_suspeito}</div>
                <div className="ficha-nome">{s.nome}</div>
                <div className="ficha-attr">Idade: <span>{s.idade} anos</span></div>
                <div className="ficha-attr">Altura: <span>{s.altura_m} m</span></div>
                <div className="ficha-attr">Peso: <span>{s.peso_kg} kg</span></div>
                <div className="ficha-attr">Olhos: <span>{s.cor_olhos}</span></div>
                <div className="ficha-attr">Natural de: <span>{s.naturalidade_cidade}, {s.naturalidade_estado}</span></div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '.75rem 0' }} />
                <div className="ficha-attr">Histórico: <span>{s.historico}</span></div>
                <div className="ficha-attr">Habilidades: <span>{s.habilidades}</span></div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '.75rem 0' }} />
                <div style={{ fontSize: '12px', color: 'var(--amber)', background: '#1a1400', borderRadius: '6px', padding: '.5rem .75rem' }}>
                  ⚠ {s.motivo_suspeita}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LOCAIS ── */}
      {aba === 'Locais' && (
        <div>
          <p className="text-sm text-muted mb-1">
            Todos os locais — cada card é uma tupla da tabela <strong>locais</strong>.
          </p>
          <div style={{ display: 'grid', gap: '.75rem' }}>
            {locais.map(l => (
              <div key={l.id} className="card">
                <div className="flex items-c gap-1 mb-1" style={{ flexWrap: 'wrap' }}>
                  <span className="badge badge-amber">ID {l.id_local}</span>
                  <span className="badge" style={{
                    background: l.nivel_acesso === 'Público' ? '#0e2010' : l.nivel_acesso === 'Padrão' ? '#0e1a26' : l.nivel_acesso === 'Restrito' ? '#1a1400' : '#200a0a',
                    color: l.nivel_acesso === 'Público' ? 'var(--teal)' : l.nivel_acesso === 'Padrão' ? '#6ab0f5' : l.nivel_acesso === 'Restrito' ? 'var(--amber)' : 'var(--red)'
                  }}>{l.nivel_acesso}</span>
                  {(l.setor || l.andar) && (
                    <span className="text-muted text-sm">{l.setor || l.andar}</span>
                  )}
                </div>
                <h3 style={{ fontWeight: 600, marginBottom: '.4rem' }}>{l.nome_comodo}</h3>
                {l.caracteristica_marcante && (
                  <p className="text-sm" style={{ color: 'var(--amber)', marginBottom: '.4rem' }}>
                    ✦ {l.caracteristica_marcante}
                  </p>
                )}
                <p className="text-sm text-muted">{l.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ACUSAR ── */}
      {aba === 'Acusar' && (
        <div style={{ maxWidth: '500px' }}>
          <h2 style={{ marginBottom: '.5rem', fontWeight: 700 }}>Fazer acusação</h2>
          <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
            Escolha quem cometeu o crime e onde o item está escondido.
          </p>

          {!resultado ? (
            <>
              <div className="acusacao-grid">
                <div>
                  <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '.4rem' }}>
                    Suspeito
                  </label>
                  <select className="acusacao-select" value={suspeitoAcus}
                    onChange={e => setSuspeitoAcus(e.target.value)}>
                    <option value="">Selecione...</option>
                    {suspeitos.map(s => (
                      <option key={s.id_suspeito} value={s.id_suspeito}>{s.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted" style={{ display: 'block', marginBottom: '.4rem' }}>
                    Esconderijo
                  </label>
                  <select className="acusacao-select" value={localAcus}
                    onChange={e => setLocalAcus(e.target.value)}>
                    <option value="">Selecione...</option>
                    {locais.map(l => (
                      <option key={l.id_local} value={l.id_local}>{l.nome_comodo}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleAcusar}
                disabled={!suspeitoAcus || !localAcus}>
                Fazer acusação
              </button>
            </>
          ) : (
            <div className={resultado.acerto ? 'resultado-acerto' : 'resultado-erro'}>
              <div className="resultado-emoji">{resultado.acerto ? '🎉' : '❌'}</div>
              <div className="resultado-titulo">
                {resultado.acerto ? 'Caso resolvido!' : 'Acusação incorreta'}
              </div>
              <p className="text-sm" style={{ marginTop: '.5rem', opacity: .8 }}>
                {resultado.acerto
                  ? 'Parabéns! Você identificou o culpado e o esconderijo usando as consultas do banco de dados.'
                  : `${!resultado.acertouSuspeito ? 'Suspeito errado. ' : ''}${!resultado.acertouLocal ? 'Esconderijo errado.' : ''} Consulte mais pistas e tente novamente.`
                }
              </p>
              {!resultado.acerto && (
                <button className="btn btn-ghost mt-1" onClick={() => setResultado(null)}>
                  Tentar novamente
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TabelaResultado({ dados, colunas }) {
  if (!dados || dados.length === 0) return (
    <p className="text-sm text-muted">Nenhum resultado encontrado para essa consulta.</p>
  )
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="sql-table">
        <thead>
          <tr>{colunas.map(c => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {dados.map((row, i) => (
            <tr key={i}>
              {colunas.map(c => <td key={c}>{row[c] ?? '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
