FROM node:22.12.0-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production=false

# Copia o resto dos arquivos
COPY . .

# Build do projeto (frontend)
RUN npm run build

# Expõe a porta
EXPOSE $PORT

# Variável de ambiente para Node.js
ENV NODE_ENV=production
ENV PORT=${PORT:-3000}

# Comando para iniciar o servidor (com tsx para executar TypeScript)
CMD ["npx", "tsx", "server.js"]
