// backend/setup.js
// Executa uma vez: node backend/setup.js
// Cria o arquivo database.db com todas as tabelas e dados dos 4 casos

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.db'));
db.pragma('journal_mode = WAL');

// ── Schema ────────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS casos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo          TEXT NOT NULL,
  descricao       TEXT NOT NULL,
  cidade          TEXT,
  estado          TEXT,
  culpado_id      INTEGER,
  esconderijo_id  INTEGER,
  ativo           INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS suspeitos (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  caso_id               INTEGER NOT NULL,
  id_suspeito           INTEGER NOT NULL,
  nome                  TEXT NOT NULL,
  idade                 INTEGER,
  altura_m              REAL,
  peso_kg               REAL,
  cor_olhos             TEXT,
  nacionalidade         TEXT,
  naturalidade_cidade   TEXT,
  naturalidade_estado   TEXT,
  historico             TEXT,
  habilidades           TEXT,
  motivo_suspeita       TEXT,
  FOREIGN KEY (caso_id) REFERENCES casos(id)
);

CREATE TABLE IF NOT EXISTS locais (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  caso_id                 INTEGER NOT NULL,
  id_local                INTEGER NOT NULL,
  nome_comodo             TEXT NOT NULL,
  andar                   TEXT,
  setor                   TEXT,
  nivel_acesso            TEXT NOT NULL,
  caracteristica_marcante TEXT,
  descricao               TEXT,
  FOREIGN KEY (caso_id) REFERENCES casos(id)
);

CREATE TABLE IF NOT EXISTS pistas (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  caso_id         INTEGER NOT NULL,
  numero          INTEGER NOT NULL,
  titulo          TEXT NOT NULL,
  enunciado       TEXT NOT NULL,
  acao_detetive   TEXT,
  conceito_bd     TEXT,
  tabela_alvo     TEXT,
  query_sql       TEXT NOT NULL,
  FOREIGN KEY (caso_id) REFERENCES casos(id)
);

CREATE TABLE IF NOT EXISTS logs_acao (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  caso_id     INTEGER NOT NULL,
  sessao_id   TEXT NOT NULL,
  pista_id    INTEGER,
  acao        TEXT NOT NULL,
  acerto      INTEGER,
  criado_em   TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (caso_id) REFERENCES casos(id),
  FOREIGN KEY (pista_id) REFERENCES pistas(id)
);
`);

// ── Seed ──────────────────────────────────────────────────────
const insertCaso     = db.prepare(`INSERT INTO casos (titulo, descricao, cidade, estado, culpado_id, esconderijo_id) VALUES (?,?,?,?,?,?)`);
const insertSuspeito = db.prepare(`INSERT INTO suspeitos (caso_id,id_suspeito,nome,idade,altura_m,peso_kg,cor_olhos,nacionalidade,naturalidade_cidade,naturalidade_estado,historico,habilidades,motivo_suspeita) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const insertLocal    = db.prepare(`INSERT INTO locais (caso_id,id_local,nome_comodo,andar,setor,nivel_acesso,caracteristica_marcante,descricao) VALUES (?,?,?,?,?,?,?,?)`);
const insertPista    = db.prepare(`INSERT INTO pistas (caso_id,numero,titulo,enunciado,acao_detetive,conceito_bd,tabela_alvo,query_sql) VALUES (?,?,?,?,?,?,?,?)`);

const seed = db.transaction(() => {

  // ── CASO 1: O Manuscrito Perdido ─────────────────────────
  const c1 = insertCaso.run('O Manuscrito Perdido',
    'Um pergaminho histórico do século XVI foi roubado da Biblioteca Real de Vila Velha durante uma manutenção elétrica. O item estava em uma redoma de vidro blindado que foi aberta com uma chave mestra.',
    'Olinda','PE', 55109, 103).lastInsertRowid;

  [
    [c1,33210,'Dr. Arnaldo Peixoto',59,1.72,80.00,'Castanhos','Brasileiro','Rio de Janeiro','RJ','Curador de obras raras há 25 anos, possui as chaves de todas as redomas.','Erudição, organização metódica e conhecimento técnico de restauro.','Desativou o protocolo de sensores de movimento para "testar a fiação".'],
    [c1,44922,'Jonas Silva',28,1.78,74.00,'Pretos','Brasileiro','Duque de Caxias','RJ','Eletricista terceirizado que presta serviços à biblioteca há dois anos.','Rapidez física, perícia em sistemas elétricos e escalada.','Flagrado por câmera de segurança em setor proibido antes do apagão.'],
    [c1,55109,'Mariana Ferraz',31,1.64,55.00,'Verdes','Brasileira','Belo Horizonte','MG','Pesquisa a vida dos jesuítas no Brasil para seu pós-doutorado.','Análise paleográfica e paciência investigativa extrema.','Tentou entrar na biblioteca com mochila maior do que o permitido.'],
  ].forEach(r => insertSuspeito.run(...r));

  [
    [c1,101,'Hall de Entrada','Térreo',null,'Público','Piso em xadrez desgastado','Balcão de jacarandá e quadros da fundação de Olinda.'],
    [c1,102,'Salão Principal de Leitura','Térreo',null,'Público','Estantes labirínticas e vitrais','Coração da biblioteca com grandes mesas de leitura coletivas.'],
    [c1,103,'Pátio Interno (Jardim dos Freis)','Térreo',null,'Público','Fonte de pedra e árvores frutíferas','Claustro a céu aberto, ideal para reuniões secretas ou escalada.'],
    [c1,104,'Sala de Restauro','Térreo',null,'Restrito','Cheiro de produtos químicos e cola','Ferramentas afiadas, prensas e lupas espalhadas pelas mesas.'],
    [c1,105,'Recepção','Térreo',null,'Público','Balcão de jacarandá','Local onde fica o funcionário e o livro de registo de visitantes.'],
    [c1,201,'Gabinete do Bibliotecário-Mor','Primeiro Andar',null,'Restrito','Cofre escondido atrás de quadro','Sala luxuosa com tapetes grossos e mesa entulhada de documentos.'],
    [c1,202,'Ala de Genealogia','Primeiro Andar',null,'Restrito','Registros de famílias nobres','Arquivos de nascimentos, terras e posses de Pernambuco.'],
  ].forEach(r => insertLocal.run(...r));

  [
    [c1,1,'O Perímetro de Segurança','Um relatório indica que os locais da série 200 (Primeiro Andar) foram lacrados às 14:00 e nenhum sensor foi disparado lá durante o apagão.','Elimine os locais do Primeiro Andar (201 e 202) da lista de esconderijos.','WHERE numérico','locais','SELECT id_local, nome_comodo, andar FROM locais WHERE caso_id = '+c1+' AND id_local < 200'],
    [c1,2,'O Registro de Naturalidade','Uma testemunha viu um suspeito consultando um mapa rodoviário de Minas Gerais momentos antes do crime.','Filtre naturalidade_estado. Dr. Arnaldo e Jonas são do RJ. Mariana é de MG.','WHERE texto','suspeitos','SELECT id_suspeito, nome, naturalidade_cidade, naturalidade_estado FROM suspeitos WHERE caso_id = '+c1+' AND naturalidade_estado = \'MG\''],
    [c1,3,'O Mistério da Chave Mestra','Apenas perfis com habilidade de Análise Paleográfica ou Curadoria poderiam abrir o fecho sem disparar o alarme.','Jonas (Eletricista) é descartado. Restam Arnaldo e Mariana.','LIKE / OR','suspeitos','SELECT id_suspeito, nome, habilidades FROM suspeitos WHERE caso_id = '+c1+' AND (habilidades LIKE \'%Paleog%\' OR habilidades LIKE \'%restauro%\')'],
    [c1,4,'O Log de Movimento','O sensor registrou apenas a entrada do ID_SUSPEITO 33210 na Sala de Restauro durante a tarde.','Arnaldo (33210) estava na Sala de Restauro (104). Ele tem álibi de localização.','WHERE numérico','suspeitos','SELECT id_suspeito, nome FROM suspeitos WHERE caso_id = '+c1+' AND id_suspeito = 33210'],
    [c1,5,'A Evidência Biométrica','Próximo ao horário do crime havia uma presença no térreo com menos de 1,70 m de altura.','Filtre altura_m < 1.70. Apenas Mariana (55109) se encaixa.','WHERE comparação','suspeitos','SELECT id_suspeito, nome, altura_m FROM suspeitos WHERE caso_id = '+c1+' AND altura_m < 1.70'],
    [c1,6,'O Cheiro do Esconderijo','Um cão farejador latiu ao sentir cheiro de frutas cítricas e terra úmida.','O Pátio Interno (103) é o único local com árvores frutíferas.','LIKE','locais','SELECT id_local, nome_comodo, caracteristica_marcante FROM locais WHERE caso_id = '+c1+' AND (caracteristica_marcante LIKE \'%frutífera%\' OR descricao LIKE \'%frutífera%\')'],
    [c1,7,'O Objeto Esquecido','Uma mochila com crachá de pesquisadora visitante foi encontrada atrás de um banco de alvenaria.','Mariana era a única pesquisadora e a única com mochila. O pátio (103) agora está ligado a ela.','Chave estrangeira narrativa','suspeitos','SELECT id_suspeito, nome, motivo_suspeita FROM suspeitos WHERE caso_id = '+c1+' AND id_suspeito = 55109'],
    [c1,8,'O Relatório Final','Um vulto foi visto indo para o Pátio (103) às 15:12. O ID_SUSPEITO 55109 não saiu pelo Hall após o apagão.','Ela não saiu e foi vista indo para o 103 — caso encerrado.','JOIN','suspeitos','SELECT s.id_suspeito, s.nome, s.altura_m, l.nome_comodo FROM suspeitos s JOIN locais l ON l.caso_id = s.caso_id WHERE s.caso_id = '+c1+' AND s.id_suspeito = 55109 AND l.id_local = 103'],
  ].forEach(r => insertPista.run(...r));

  // ── CASO 2: O Chip Arara-Azul ────────────────────────────
  const c2 = insertCaso.run('O Chip Arara-Azul',
    'Um protótipo de processamento quântico foi subtraído do Laboratório Tecnológico Nexus. O laboratório possui acesso biométrico e o sistema foi invadido digitalmente no momento do furto.',
    'São José dos Campos','SP', 11043, 201).lastInsertRowid;

  [
    [c2,11043,'Dr. Marcos Pontes Jr.',45,1.80,85.00,'Castanhos','Brasileiro','Campinas','SP','Um dos criadores da arquitetura do chip Arara-Azul.','Engenharia reversa e programação de baixo nível.','Teve o acesso negado ao bônus anual da empresa dias antes do incidente.'],
    [c2,22087,'Lúcia Cavalcanti',40,1.75,68.00,'Castanhos','Brasileira','Recife','PE','Ex-capitã da PM, gerencia a segurança do laboratório há 5 anos.','Estratégia de defesa, tiro e monitoramento de sistemas.','O log de segurança mostra que sua senha pessoal foi usada para abrir a porta.'],
    [c2,33076,'Thiago Oliveira',22,1.70,63.00,'Pretos','Brasileiro','Brasília','DF','Aluno de Engenharia da Computação, estagiário há 6 meses.','Invasão de redes, bypass de firewall e agilidade digital.','Instalou um dispositivo USB desconhecido no servidor central na tarde do crime.'],
  ].forEach(r => insertSuspeito.run(...r));

  [
    [c2,101,'Área de Robótica e IA',null,'Engenharia','Padrão',null,'Espaço com braços mecânicos industriais para automação de testes.'],
    [c2,102,'Sala de Análise de Material',null,'Qualidade','Padrão',null,'Contém espectrômetros e simuladores de estresse térmico.'],
    [c2,103,'Sala de Manufatura de Protótipos',null,'Engenharia','Restrito',null,'Sala limpa (cleanroom) onde os chips são impressos.'],
    [c2,201,'Sala de P&D',null,'Pesquisa','Restrito',null,'Ambiente isolado focado na arquitetura de chips quânticos. Possui cofres de dados locais.'],
    [c2,202,'Centro de Comando',null,'Administração','Super Restrito',null,'Nervo central do laboratório, com acesso direto aos logs e painéis de energia.'],
    [c2,203,'Sala de Segurança',null,'Segurança','Super Restrito',null,'Base de operações da equipe de defesa digital e monitoramento do firewall.'],
  ].forEach(r => insertLocal.run(...r));

  [
    [c2,1,'O Log de Climatização','O pico de energia queimou os compressores do setor de Engenharia. O chip derrete sem refrigeração por mais de 10 minutos.','Elimine as salas do setor Engenharia (101 e 103) como esconderijos.','WHERE texto','locais','SELECT id_local, nome_comodo, setor FROM locais WHERE caso_id = '+c2+' AND setor != \'Engenharia\''],
    [c2,2,'O Rastreio de Frequência','Salas Super Restrito são Gaiolas de Faraday — bloqueiam 100% dos sinais. O chip está emitindo sinal.','Elimine 202 e 203. Restam Sala de Análise (102) e P&D (201).','WHERE texto','locais','SELECT id_local, nome_comodo, nivel_acesso FROM locais WHERE caso_id = '+c2+' AND nivel_acesso != \'Super Restrito\' AND setor != \'Engenharia\''],
    [c2,3,'A Cancela do Estacionamento','O veículo do crachá ID 33076 saiu dois minutos antes do apagão começar.','Thiago (33076) estava fora do laboratório. Inocentado.','WHERE numérico','suspeitos','SELECT id_suspeito, nome FROM suspeitos WHERE caso_id = '+c2+' AND id_suspeito = 33076'],
    [c2,4,'A Tensão na Catraca','Uma pessoa de 68 kg ficou presa no fosso da escada durante todo o apagão. A senha de Lúcia foi usada remotamente.','Filtre peso_kg = 68. Lúcia estava imobilizada. Inocentada.','WHERE comparação','suspeitos','SELECT id_suspeito, nome, peso_kg FROM suspeitos WHERE caso_id = '+c2+' AND peso_kg = 68.0'],
    [c2,5,'O Rastro de Código','O invasor desmontou o código base do sistema peça por peça — não foi invasão comum.','Engenharia Reversa é especialidade do Dr. Marcos (11043).','LIKE','suspeitos','SELECT id_suspeito, nome, habilidades FROM suspeitos WHERE caso_id = '+c2+' AND habilidades LIKE \'%engenharia reversa%\''],
    [c2,6,'O Inventário Local','Os dados foram redirecionados via cabo para um cômodo com "cofres de dados locais" na descrição.','LIKE em descricao. Apenas a Sala de P&D (201) menciona cofres de dados locais.','LIKE','locais','SELECT id_local, nome_comodo, descricao FROM locais WHERE caso_id = '+c2+' AND descricao LIKE \'%cofres de dados locais%\''],
    [c2,7,'O Bug do Ano Bissexto','O perfil que forçou o acesso tinha data de nascimento há mais de 40 anos.','Filtre idade > 40. Thiago tem 22. Dr. Marcos tem 45.','WHERE comparação','suspeitos','SELECT id_suspeito, nome, idade FROM suspeitos WHERE caso_id = '+c2+' AND idade > 40'],
    [c2,8,'O Metadado do Documento','O IP do e-mail de chantagem pertence ao estado de SP. O texto reclama de bônus negado.','Cruce naturalidade_estado SP + local 201 + motivo. Culpado: 11043.','JOIN','suspeitos','SELECT s.id_suspeito, s.nome, s.naturalidade_estado, l.nome_comodo FROM suspeitos s JOIN locais l ON l.caso_id = s.caso_id WHERE s.caso_id = '+c2+' AND s.naturalidade_estado = \'SP\' AND l.id_local = 201'],
  ].forEach(r => insertPista.run(...r));

  // ── CASO 3: A Moeda Imperial ─────────────────────────────
  const c3 = insertCaso.run('A Moeda Imperial',
    'Uma raríssima moeda da coroação desapareceu do Museu do Patrimônio durante a troca de turno dos seguranças. A peça foi trocada por uma réplica de latão.',
    'Petrópolis','RJ', 66041, 201).lastInsertRowid;

  [
    [c3,66041,'Sr. Wilson Nonato',62,1.65,70.00,'Cinzas','Brasileiro','Ouro Preto','MG','Especialista em numismática e metais preciosos do museu.','Forja artística, ourivesaria e perícia em autenticação.','Possuía os moldes e ferramentas para criar a réplica encontrada.'],
    [c3,77052,'Dra. Helena Valente',48,1.67,60.00,'Azuis','Brasileira','Curitiba','PR','Nomeada diretora há 3 anos para modernizar o museu.','Gestão pública, contatos internacionais e acesso às chaves de segurança.','Estava com dificuldades financeiras e foi vista com um colecionador.'],
    [c3,88063,'Aparecido Bento',55,1.74,88.00,'Castanhos','Brasileiro','Três Rios','RJ','Funcionário concursado, trabalha no prédio há 20 anos.','Conhecimento de passagens antigas e manutenção estrutural.','Encontrado em um duto de ventilação que dá acesso à sala das moedas.'],
  ].forEach(r => insertSuspeito.run(...r));

  [
    [c3,101,'Salão da Coroação',null,'Exposição','Público',null,'Onde as joias reais e a moeda original ficavam guardadas sob vidro.'],
    [c3,102,'Sala de Exibições Temporárias',null,'Exposição','Público',null,'Espaço amplo de trânsito variável, ideal para encontros discretos.'],
    [c3,201,'Oficina de Restauro',null,'Técnico','Restrito',null,'Repleta de ferramentas de precisão, forjas de bancada e metais diversos.'],
    [c3,202,'Arquivo Histórico',null,'Administrativo','Restrito',null,'Guarda plantas antigas do prédio e registros originais das peças.'],
    [c3,203,'Sala de Segurança',null,'Segurança','Super Restrito',null,'Ponto crítico de monitoramento; ficou vulnerável durante a troca de turno.'],
  ].forEach(r => insertLocal.run(...r));

  [
    [c3,1,'O Log de Carga','A tábua do assoalho suporta no máximo 80 kg. A rota de fuga não quebrou a tábua.','Aparecido (88 kg) teria quebrado o piso. Inocentado da rota principal.','WHERE comparação','suspeitos','SELECT id_suspeito, nome, peso_kg FROM suspeitos WHERE caso_id = '+c3+' AND peso_kg <= 80'],
    [c3,2,'O Protocolo de Lockdown','Nenhum funcionário conseguiu entrar em locais dos setores Administrativo ou Segurança durante o crime.','Elimine Arquivo Histórico (202) e Sala de Segurança (203) como esconderijos.','WHERE / NOT IN','locais','SELECT id_local, nome_comodo, setor FROM locais WHERE caso_id = '+c3+' AND setor NOT IN (\'Administrativo\', \'Segurança\')'],
    [c3,3,'A Varredura de Retina','O algoritmo marcou: pigmento dos olhos do ladrão != Azuis.','Filtre cor_olhos != Azuis. Aponta para Wilson (Cinzas).','WHERE / NOT','suspeitos','SELECT id_suspeito, nome, cor_olhos FROM suspeitos WHERE caso_id = '+c3+' AND cor_olhos != \'Azuis\''],
    [c3,4,'O Lockdown de Locais Públicos','Todas as salas Público foram trancadas 5 minutos antes do crime.','Elimine Salão da Coroação (101) e Exibições Temporárias (102).','WHERE texto','locais','SELECT id_local, nome_comodo, nivel_acesso FROM locais WHERE caso_id = '+c3+' AND nivel_acesso != \'Público\''],
    [c3,5,'O Detector Térmico','Pico de 900°C detectado em sala com a palavra "forjas" na descrição.','LIKE em descricao. Apenas a Oficina de Restauro (201) menciona forjas.','LIKE','locais','SELECT id_local, nome_comodo, descricao FROM locais WHERE caso_id = '+c3+' AND descricao LIKE \'%forja%\''],
    [c3,6,'O Despiste do Zelador','Objeto de 1,74 m entalado no duto durante toda a madrugada.','Aparecido (1,74 m) estava imobilizado no duto. Álibi confirmado.','WHERE comparação','suspeitos','SELECT id_suspeito, nome, altura_m FROM suspeitos WHERE caso_id = '+c3+' AND altura_m = 1.74'],
    [c3,7,'A Conexão Final','A perícia localizou o ouro em um cômodo Restrito do setor Técnico.','Apenas a Oficina de Restauro (201) é Restrito + Técnico.','AND','locais','SELECT id_local, nome_comodo, setor, nivel_acesso FROM locais WHERE caso_id = '+c3+' AND nivel_acesso = \'Restrito\' AND setor = \'Técnico\''],
  ].forEach(r => insertPista.run(...r));

  // ── CASO 4: A Essência de Lótus ──────────────────────────
  const c4 = insertCaso.run('A Essência de Lótus',
    'A fórmula secreta de um perfume de luxo foi roubada do cofre do Ateliê Aroma Real. O cofre exige combinação numérica e leitura de impressão digital.',
    'Curitiba','PR', 23088, 201).lastInsertRowid;

  [
    [c4,12099,'Gabriel Valeriano',27,1.79,70.00,'Mel','Brasileiro','Grasse','BR','Braço direito do mestre perfumista da marca.','Memória olfativa, química fina e precisão laboratorial.','Tentou patentear uma fórmula similar em seu próprio nome recentemente.'],
    [c4,23088,'Sandra Regina',52,1.62,64.00,'Pretos','Brasileira','Florianópolis','SC','Trabalha na administração da empresa desde a fundação.','Organização de dados sigilosos e leitura labial.','Foi a única pessoa, além do dono, a entrar na sala do cofre no dia do crime.'],
    [c4,34077,'Roberto Franco',46,1.85,92.00,'Castanhos','Brasileiro','Porto Alegre','RS','Ex-sócio da empresa, hoje dono de uma marca concorrente.','Negociação agressiva, espionagem industrial e carisma.','Estava no prédio para uma "conversa amigável" na hora do roubo.'],
  ].forEach(r => insertSuspeito.run(...r));

  [
    [c4,101,'Recepção',null,'Comercial','Público',null,'Entrada luxuosa com balcão de mármore e poltronas de veludo.'],
    [c4,102,'Sala de Reuniões',null,'Administrativo','Padrão',null,'Mesa de vidro e paredes de vidro fosco para apresentações de negócios.'],
    [c4,201,'Escritório do Diretor',null,'Administrativo','Restrito',null,'Ambiente com mobília clássica e uma entrada oculta para o cofre.'],
    [c4,202,'Sala da Secretária',null,'Administrativo','Padrão',null,'Posto de trabalho com acesso direto ao gabinete do diretor.'],
    [c4,301,'Sala do Cofre',null,'Segurança','Super Restrito',null,'Câmara blindada com leitor biométrico e teclado numérico de alta precisão.'],
    [c4,302,'Laboratório de Perfumaria',null,'Técnico','Restrito',null,'Bancadas de inox com balanças de precisão e centenas de frascos de teste.'],
    [c4,303,'Armazenamento de Essências',null,'Técnico','Restrito',null,'Ambiente climatizado e escuro para preservar as matérias-primas.'],
    [c4,304,'Sala de Segurança',null,'Segurança','Super Restrito',null,'Central de controle com telas de alta definição e servidores de log.'],
  ].forEach(r => insertLocal.run(...r));

  [
    [c4,1,'O Registro Biométrico','O sistema registrou que apenas uma pessoa entrou na Sala do Cofre além do dono — alguém com acesso ao gabinete do diretor.','Filtre nivel_acesso = Super Restrito para identificar onde o cofre fica.','WHERE texto','locais','SELECT id_local, nome_comodo, nivel_acesso FROM locais WHERE caso_id = '+c4+' AND nivel_acesso = \'Super Restrito\''],
    [c4,2,'O Protocolo de Emergência','Salas Super Restrito foram lacradas no lockdown — nenhum item pode ter sido escondido lá.','Elimine Sala do Cofre (301) e Sala de Segurança (304) como esconderijos.','WHERE texto','locais','SELECT id_local, nome_comodo, nivel_acesso FROM locais WHERE caso_id = '+c4+' AND nivel_acesso != \'Super Restrito\''],
    [c4,3,'O Sensor de Vibração','O assoalho do corredor suportou no máximo 75 kg durante o crime. Acima disso o alarme dispararia.','Filtre peso_kg <= 75. Roberto (92 kg) é descartado da rota de fuga.','WHERE comparação','suspeitos','SELECT id_suspeito, nome, peso_kg FROM suspeitos WHERE caso_id = '+c4+' AND peso_kg <= 75'],
    [c4,4,'O Log de Reunião','Roberto Franco estava em reunião gravada pelo sistema de vídeo durante todo o período do roubo.','Roberto tem álibi confirmado. Inocentado.','WHERE numérico','suspeitos','SELECT id_suspeito, nome, motivo_suspeita FROM suspeitos WHERE caso_id = '+c4+' AND id_suspeito = 34077'],
    [c4,5,'A Rota do Perfume','O sensor olfativo detectou a fórmula em um cômodo do setor Administrativo com nivel_acesso Restrito.','Apenas o Escritório do Diretor (201) é Administrativo + Restrito.','AND','locais','SELECT id_local, nome_comodo, setor, nivel_acesso FROM locais WHERE caso_id = '+c4+' AND setor = \'Administrativo\' AND nivel_acesso = \'Restrito\''],
    [c4,6,'A Descrição do Cômodo','Vestígios da fórmula foram encontrados próximos a uma "entrada oculta para o cofre".','LIKE em descricao. Apenas o Escritório do Diretor (201) menciona entrada oculta.','LIKE','locais','SELECT id_local, nome_comodo, descricao FROM locais WHERE caso_id = '+c4+' AND descricao LIKE \'%entrada oculta%\''],
    [c4,7,'O Perfil da Suspeita','O log confirma que apenas uma suspeita esteve no Escritório do Diretor. Ela tem acesso a dados sigilosos.','Filtre habilidades com dados sigilosos. Sandra (23088) é a única.','LIKE','suspeitos','SELECT id_suspeito, nome, habilidades, motivo_suspeita FROM suspeitos WHERE caso_id = '+c4+' AND habilidades LIKE \'%dados sigilosos%\''],
    [c4,8,'A Conexão Final','O IP do sistema biométrico pertence ao estado de SC. Sandra Regina, de Florianópolis, SC, foi a última a sair do Escritório.','Cruce naturalidade_estado SC + local 201. Sandra Regina (23088) é a culpada.','JOIN','suspeitos','SELECT s.id_suspeito, s.nome, s.naturalidade_estado, l.nome_comodo FROM suspeitos s JOIN locais l ON l.caso_id = s.caso_id WHERE s.caso_id = '+c4+' AND s.naturalidade_estado = \'SC\' AND l.id_local = 201'],
  ].forEach(r => insertPista.run(...r));

});

seed();
db.close();
console.log('✅ Banco de dados criado com sucesso: backend/database.db');
console.log('   4 casos, suspeitos, locais e pistas inseridos.');
