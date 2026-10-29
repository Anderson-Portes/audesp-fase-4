# Etapa 1: Build da aplicação React com Node
FROM node:20-alpine AS build

WORKDIR /app

# Configura npm para bypassar problemas com proxy/SSL corporativo se necessário
RUN npm config set strict-ssl false

# Copia arquivos de dependências
COPY package.json package-lock.json* ./

# Instala dependências
RUN npm install

# Copia todo o código-fonte
COPY . .

# Compila para produção (/app/dist)
RUN npm run build

# Etapa 2: Servidor Web Nginx
FROM nginx:alpine

# Remove configuração padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copia configuração customizada para SPA e proxy da API
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos compilados da etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
