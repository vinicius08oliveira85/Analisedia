import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Wrapper para converter Express req/res para formato Vercel
function vercelWrapper(handler) {
  return async (req, res) => {
    try {
      // Cria objetos compatíveis com VercelRequest e VercelResponse
      const vercelReq = {
        method: req.method,
        query: req.query,
        body: req.body,
        headers: req.headers,
        url: req.url,
        ...req
      };
      
      const vercelRes = {
        status: (code) => {
          res.status(code);
          return vercelRes;
        },
        json: (data) => {
          res.json(data);
        },
        send: (data) => {
          res.send(data);
        },
        setHeader: (name, value) => {
          res.setHeader(name, value);
        },
        end: () => {
          res.end();
        },
        ...res
      };
      
      await handler(vercelReq, vercelRes);
    } catch (error) {
      console.error('Erro ao processar requisição:', error);
      res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
  };
}

// Importa e registra as rotas da API
async function setupApiRoutes() {
  // Importa dinamicamente os handlers das APIs
  const matchDetailsHandler = (await import('./api/match-details.js')).default;
  const scrapeMatchesHandler = (await import('./api/scrape-matches.js')).default;
  const scrapeMatchDetailsHandler = (await import('./api/scrape-match-details.js')).default;
  const matchesHandler = (await import('./api/matches.js')).default;
  const liveStatusHandler = (await import('./api/live-status.js')).default;

  // Registra as rotas da API com wrapper
  app.post('/api/match-details', vercelWrapper(matchDetailsHandler));
  app.get('/api/scrape-matches', vercelWrapper(scrapeMatchesHandler));
  app.post('/api/scrape-matches', vercelWrapper(scrapeMatchesHandler));
  app.get('/api/scrape-match-details', vercelWrapper(scrapeMatchDetailsHandler));
  app.post('/api/scrape-match-details', vercelWrapper(scrapeMatchDetailsHandler));
  app.get('/api/matches', vercelWrapper(matchesHandler));
  app.post('/api/matches', vercelWrapper(matchesHandler));
  app.get('/api/live-status', vercelWrapper(liveStatusHandler));
  app.post('/api/live-status', vercelWrapper(liveStatusHandler));
}

// Serve arquivos estáticos do build do Vite
app.use(express.static(join(__dirname, 'dist')));

// Roteamento SPA - todas as rotas que não são /api/* servem index.html
app.get('*', (req, res) => {
  // Se for uma rota de API, não serve index.html
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // Serve index.html para todas as outras rotas (SPA routing)
  const indexPath = join(__dirname, 'dist', 'index.html');
  try {
    const html = readFileSync(indexPath, 'utf-8');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error loading index.html');
  }
});

// Inicia o servidor
async function startServer() {
  try {
    await setupApiRoutes();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📦 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

