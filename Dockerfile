FROM node:22.12.0-alpine

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o resto dos arquivos
COPY . .

# Build do projeto
RUN npm run build

# Expõe a porta
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"]
