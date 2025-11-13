# Use Node.js 22.12.0 (compatível com @vitejs/plugin-react@5.1.1)
FROM node:22.12.0-alpine

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm install --legacy-peer-deps

# Copia o resto do código
COPY . .

# Build da aplicação
RUN npm run build

# Expõe a porta
EXPOSE 3000

# Define variável de ambiente para a porta
ENV PORT=3000

# Inicia o servidor
CMD ["npm", "start"]
