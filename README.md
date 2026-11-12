# 🔍 Detetives de Dados — versão local

React + Express + SQLite. Roda inteiramente no seu computador, sem nenhum serviço externo.

---

## Estrutura

```
detetives-de-dados/
├── src/                        ← Frontend React
│   ├── lib/api.js              ← chamadas ao backend
│   └── pages/
│       ├── ListaCasos.jsx
│       ├── Caso.jsx
│       └── Admin.jsx
├── backend/
│   ├── server.js               ← servidor Express (API + SQLite)
│   ├── setup.js                ← cria o banco e insere os 4 casos
│   ├── database.db             ← gerado automaticamente pelo setup
│   └── package.json
├── index.html
├── vite.config.js
└── package.json
```

---

## Como rodar — passo a passo

### 1. Instalar dependências do frontend

Abra o terminal na pasta raiz do projeto:

```bash
npm install
```

### 2. Instalar dependências do backend

```bash
cd backend
npm install
cd ..
```

### 3. Criar o banco de dados (só na primeira vez)

```bash
node backend/setup.js
```

Isso cria o arquivo `backend/database.db` com os 4 casos completos.

### 4. Iniciar o servidor backend

**Terminal 1:**
```bash
node backend/server.js
```

Você verá:
```
🔍 Detetives de Dados — servidor rodando em http://localhost:3001
```

### 5. Iniciar o frontend

**Terminal 2:**
```bash
npm run dev
```

Acesse em: **http://localhost:5173**

---

## No IntelliJ IDEA

1. Abra a pasta do projeto no IntelliJ
2. Abra dois terminais integrados (Alt+F12)
3. Terminal 1: `node backend/server.js`
4. Terminal 2: `npm run dev`
5. Clique no link `http://localhost:5173` que aparece no terminal

### Ver o banco de dados no IntelliJ

1. Vá em **View → Tool Windows → Database**
2. Clique no **+** → **Data Source → SQLite**
3. Em "File", navegue até `backend/database.db`
4. Clique em **Test Connection** → OK

Você verá todas as tabelas e pode consultar diretamente.

---

## Rotas da API

| Método | Rota | O que faz |
|--------|------|-----------|
| GET | /casos | Lista todos os casos ativos |
| GET | /casos/:id | Dados de um caso |
| GET | /casos/:id/suspeitos | Suspeitos do caso |
| GET | /casos/:id/locais | Locais do caso |
| GET | /casos/:id/pistas | Pistas (sem a query SQL) |
| POST | /pistas/:id/consultar | Executa a query SQL da pista |
| POST | /casos/:id/acusar | Verifica a acusação e registra |
| GET | /admin/logs/:caso_id | Logs + estatísticas do caso |

---

## Casos incluídos

| # | Título | Cidade | Culpado |
|---|--------|--------|---------|
| 1 | O Manuscrito Perdido | Olinda, PE | Mariana Ferraz (55109) |
| 2 | O Chip Arara-Azul | São José dos Campos, SP | Dr. Marcos Pontes (11043) |
| 3 | A Moeda Imperial | Petrópolis, RJ | Sr. Wilson Nonato (66041) |
| 4 | A Essência de Lótus | Curitiba, PR | Sandra Regina (23088) |
