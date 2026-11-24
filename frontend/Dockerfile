# Etapa 1: Build da aplicação React com Node
FROM node:20-alpine AS build

WORKDIR /app

# Configura npm para bypassar problemas com proxy/SSL corporativo se necessário
RUN npm config set strict-ssl false

# Argumento para URL da API injetado pelo docker compose (lido do .env raiz)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

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

# Copia configuração customizada como template dinâmico para substituir ${FRONTEND_PORT}
RUN mkdir -p /etc/nginx/templates
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copia os arquivos compilados da etapa de build
COPY --from=build /app/dist /usr/share/nginx/html

ENV FRONTEND_PORT=80
ENV NGINX_ENVSUBST_FILTER=FRONTEND_PORT

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
