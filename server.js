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
  try {
    console.log('📥 Importando handlers da API...');
    
    // Importa dinamicamente os handlers das APIs (TypeScript com tsx)
    console.log('  - Importando match-details...');
    const matchDetailsHandler = (await import('./api/match-details.ts')).default;
    
    console.log('  - Importando scrape-matches...');
    const scrapeMatchesHandler = (await import('./api/scrape-matches.ts')).default;
    
    console.log('  - Importando scrape-match-details...');
    const scrapeMatchDetailsHandler = (await import('./api/scrape-match-details.ts')).default;
    
    console.log('  - Importando matches...');
    const matchesHandler = (await import('./api/matches.ts')).default;
    
    console.log('  - Importando live-status...');
    const liveStatusHandler = (await import('./api/live-status.ts')).default;
    
    console.log('✅ Todos os handlers importados com sucesso');

    // Registra as rotas da API com wrapper
    console.log('🔗 Registrando rotas...');
    app.post('/api/match-details', vercelWrapper(matchDetailsHandler));
    app.get('/api/scrape-matches', vercelWrapper(scrapeMatchesHandler));
    app.post('/api/scrape-matches', vercelWrapper(scrapeMatchesHandler));
    app.get('/api/scrape-match-details', vercelWrapper(scrapeMatchDetailsHandler));
    app.post('/api/scrape-match-details', vercelWrapper(scrapeMatchDetailsHandler));
    app.get('/api/matches', vercelWrapper(matchesHandler));
    app.post('/api/matches', vercelWrapper(matchesHandler));
    app.get('/api/live-status', vercelWrapper(liveStatusHandler));
    app.post('/api/live-status', vercelWrapper(liveStatusHandler));
    
    console.log('✅ Rotas registradas');
  } catch (error) {
    console.error('❌ Erro ao configurar rotas da API:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Inicia o servidor
async function startServer() {
  try {
    console.log('🔄 Iniciando servidor...');
    console.log('📁 Diretório atual:', __dirname);
    console.log('📦 Node version:', process.version);
    
    // IMPORTANTE: Configurar rotas da API PRIMEIRO
    await setupApiRoutes();
    console.log('✅ Rotas da API configuradas');
    
    // Serve arquivos estáticos do build do Vite (DEPOIS das rotas da API)
    app.use(express.static(join(__dirname, 'dist')));
    console.log('✅ Arquivos estáticos configurados');
    
    // Roteamento SPA - todas as rotas que não são /api/* servem index.html (POR ÚLTIMO)
    app.get('*', (req, res) => {
      // Se for uma rota de API, não serve index.html (não deveria chegar aqui se as rotas da API estiverem funcionando)
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      
      // Serve index.html para todas as outras rotas (SPA routing)
      const indexPath = join(__dirname, 'dist', 'index.html');
      try {
        const html = readFileSync(indexPath, 'utf-8');
        res.send(html);
      } catch (error) {
        console.error('Erro ao carregar index.html:', error);
        res.status(500).send('Error loading index.html');
      }
    });
    console.log('✅ Roteamento SPA configurado');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📦 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Acesse: http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Erro não capturado:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promise rejeitada não tratada:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

startServer();

