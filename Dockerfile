FROM node:22.12.0-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o resto dos arquivos
COPY . .

# Build do projeto (frontend)
RUN npm run build

# Instala tsx globalmente para executar TypeScript
RUN npm install -g tsx

# Expõe a porta
EXPOSE 3000

# Comando para iniciar o servidor (com tsx para executar TypeScript)
CMD ["npx", "tsx", "server.js"]
