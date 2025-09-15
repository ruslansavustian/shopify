FROM node:20-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev && npm cache clean --force
# Remove CLI packages since we don't need them in production by default.
# Remove this line if you want to run CLI commands in your container.
RUN npm remove @shopify/cli

COPY . .

# Switch to PostgreSQL schema and generate client
RUN cp prisma/schema.postgresql.prisma prisma/schema.prisma
RUN npx prisma generate
RUN npx prisma migrate deploy
RUN npm run build

CMD ["npm", "run", "docker-start"]
