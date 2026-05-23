# FURY Meta Ads Webhook API

Mini-API em Node.js + TypeScript para simular o fluxo de recebimento de uma violacao de anuncio, validacao do payload, enfileiramento de takedown com BullMQ e processamento assíncrono via worker.

## Stack

- Node.js 22+
- TypeScript
- Fastify
- Zod
- BullMQ
- Redis
- Vitest

## Requisitos atendidos

- `POST /webhook/violation` recebe o webhook de violacao.
- Payload validado com Zod.
- Erros de validacao retornam `400` com detalhes.
- Job `ad-takedown` enfileirado com BullMQ.
- Worker chama `https://jsonplaceholder.typicode.com/posts/1` para simular Meta Ads API.
- Falhas HTTP `4xx/5xx` e timeout fazem o job falhar e entrar em retry.
- Retry automatico com backoff exponencial, maximo de 3 tentativas.
- Idempotencia por `tenantId + adId`: a mesma combinacao nao gera dois jobs simultaneos.
- `GET /jobs/:id` retorna status, tentativas, resultado e erro.

## Como rodar localmente

Clone o repositorio e instale as dependencias:

```bash
corepack enable
corepack prepare pnpm@9.15.5 --activate
pnpm install
```

Suba o Redis:

```bash
docker compose up -d
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Em um terminal, rode a API:

```bash
pnpm dev
```

Em outro terminal, rode o worker:

```bash
pnpm dev:worker
```

A API ficara disponivel em:

```text
http://localhost:3000
```

## Exemplos de uso

Enviar webhook valido:

```bash
curl -X POST http://localhost:3000/webhook/violation \
  -H "Content-Type: application/json" \
  -d '{
    "adId": "ad_123",
    "tenantId": "tenant_456",
    "violationType": "PROHIBITED_TERM",
    "severity": "HIGH",
    "detectedAt": "2026-05-23T13:00:00.000Z"
  }'
```

Resposta esperada:

```json
{
  "jobId": "takedown:tenant_456:ad_123",
  "status": "queued"
}
```

Enviar o mesmo payload enquanto o job ainda esta na fila ou em processamento retorna o mesmo `jobId`:

```json
{
  "jobId": "takedown:tenant_456:ad_123",
  "status": "already_queued"
}
```

Consultar status do job:

```bash
curl http://localhost:3000/jobs/takedown:tenant_456:ad_123
```

Formato de resposta:

```json
{
  "jobId": "takedown:tenant_456:ad_123",
  "status": "completed",
  "attempts": 1,
  "result": {
    "metaApiStatus": 200,
    "processedAt": "2026-05-23T13:00:05.000Z"
  },
  "error": null
}
```

## Testando falhas e retry

Para simular falha HTTP, altere no `.env`:

```env
META_API_URL=https://jsonplaceholder.typicode.com/invalid-endpoint
```

Reinicie API e worker. O worker recebera `404`, falhara o job e BullMQ tentara novamente com backoff exponencial ate 3 tentativas.

Para simular timeout, configure um valor muito baixo:

```env
META_API_TIMEOUT_MS=1
```

## Scripts

```bash
pnpm dev          # API em modo watch
pnpm dev:worker   # Worker em modo watch
pnpm build        # Compila TypeScript
pnpm start        # Executa API compilada
pnpm worker       # Executa worker compilado
pnpm typecheck    # Verifica tipos
pnpm lint         # Executa ESLint
pnpm test         # Executa testes
```

## Decisoes tecnicas

A idempotencia foi implementada usando `jobId` deterministico no BullMQ: `takedown:{tenantId}:{adId}`. Antes de criar um novo job, a API verifica se ja existe job ativo, aguardando, atrasado ou priorizado para a mesma combinacao. Jobs concluidos ou falhados permitem uma nova solicitacao posterior, o que evita duplicidade simultanea sem bloquear reprocessamentos futuros.

O worker nao depende do conteudo retornado pelo JSONPlaceholder. Ele apenas trata `2xx` como sucesso e `4xx/5xx` ou timeout como falha, deixando o retry para o BullMQ.
