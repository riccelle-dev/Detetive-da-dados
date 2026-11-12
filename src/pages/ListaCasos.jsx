import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCasos } from '../lib/api'

export default function ListaCasos() {
  const [casos, setCasos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getCasos()
      .then(d => { setCasos(d); setLoading(false) })
      .catch(() => {
        setErro('Não foi possível conectar ao servidor. Rode: node backend/server.js')
        setLoading(false)
      })
  }, [])

  return (
    <div className="container">
      <div className="header">
        <h1>🔍 Detetives de Dados</h1>
        <p>Resolva o crime consultando o banco de dados. Cada pista é uma consulta SQL real.</p>
      </div>

      {loading && <p className="text-muted">Carregando casos...</p>}

      {erro && (
        <div style={{ background: '#200a0a', border: '1px solid var(--red)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' }}>
          <p style={{ color: 'var(--red)', fontWeight: 600, marginBottom: '.25rem' }}>Servidor offline</p>
          <p className="text-sm text-muted">{erro}</p>
          <code style={{ display: 'block', marginTop: '.75rem', fontSize: '13px', color: 'var(--amber)', background: '#1a1000', padding: '.5rem .75rem', borderRadius: '6px' }}>
            node backend/server.js
          </code>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {casos.map((caso, i) => (
          <div key={caso.id} className="card" style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/caso/${caso.id}`)}>
            <div className="flex items-c justify-b mb-1">
              <span className="badge badge-purple">Caso {i + 1}</span>
              <span className="text-muted text-sm">{caso.cidade}, {caso.estado}</span>
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '.5rem', color: 'var(--purple-l)' }}>
              {caso.titulo}
            </h2>
            <p className="text-sm text-muted">{caso.descricao}</p>
            <div className="mt-1">
              <button className="btn btn-primary">Investigar →</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 text-sm text-muted" style={{ textAlign: 'center' }}>
        <a href="/admin" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
          Painel de administração
        </a>
      </div>
    </div>
  )
}
