# ExchangeX

A backend-focused implementation of a cryptocurrency spot exchange, built to understand how exchanges are actually architected under the hood — not a UI clone of Binance or Coinbase, but an attempt at the real engineering problems: matching, settlement, event-driven services, and market data generation.

This is not a CRUD app with a `POST /orders` route that writes straight to a database. Orders are validated, forwarded to an isolated matching engine, matched in memory against a Redis-backed order book, and settled asynchronously through a chain of event consumers.

## Table of contents

- [Why this exists](#why-this-exists)
- [Architecture](#architecture)
- [Services](#services)
- [Matching engine](#matching-engine)
- [Order book](#order-book)
- [Wallets and settlement](#wallets-and-settlement)
- [Candlestick generation](#candlestick-generation)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Design principles](#design-principles)
- [Status](#status)
- [Roadmap](#roadmap)

## Why this exists

Most side-project "exchanges" are a form that inserts a row into an `orders` table and calls it done. That's not how exchanges work, and it doesn't teach you anything about the parts that are actually hard: price-time priority, partial fills, keeping a matching engine fast and deterministic, and making sure the rest of the system doesn't fall over when the engine is under load.

ExchangeX exists to build those parts properly:

- Price-time priority matching
- An in-memory, Redis-backed order book
- A matching engine with no database writes and no side effects outside of emitting events
- Event-driven settlement, trade persistence, and analytics
- Idempotent event consumers, because at-least-once delivery is the default assumption

## Architecture

Microservices, single responsibility per service, communication through events rather than direct calls between business services.

```
Client
  │
  ▼
Primary Backend  ──publishes orders──▶  Matching Engine
  │                                          │
  │                                    TradeExecuted event
  │                                          │
  │                    ┌─────────────────────┼─────────────────────┐
  │                    ▼                     ▼                     ▼
  │              Trade Service       Analytics Service     Notification Service
  │                    │                     │                     │
  │                    └─────────────────────┴─────────────────────┘
  │                                          │
  ▼                                          ▼
Wallet Service                          PostgreSQL

Redis: active order books + in-flight candle state
```

The matching engine is deliberately kept off the request path for anything that isn't matching. It doesn't write to Postgres, it doesn't call Stripe, it doesn't send emails — it maintains order books and emits `TradeExecuted` events. Everything downstream of that is a consumer that can be added, removed, or replayed without touching the engine.

## Services

### Primary Backend

Everything client-facing that isn't matching:

- Authentication (JWT)
- User management
- Wallet APIs
- Order APIs
- Portfolio and asset APIs
- Stripe integration for deposits
- Balance validation before an order is allowed to leave this service
- Publishing validated orders to the Matching Engine

### Matching Engine

- Maintains the order book per trading pair
- Executes trades under price-time priority
- Handles partial fills and market orders
- Publishes `TradeExecuted` events
- Performs zero database writes — order books live entirely in Redis, and everything else is asynchronous

### Wallet Service

- Wallet creation
- Balance updates, deposits, withdrawals
- Reserved balances (funds locked against open orders)
- Settlement after trade execution

Deposits currently go through Stripe. Balance and reserved-balance checks happen in the Primary Backend before an order is forwarded to the engine — the engine should never see an order it can't settle.

### Trade Service

- Persists trades
- Updates order history
- Stores execution records

Consumes `TradeExecuted` events; the matching engine itself never touches Postgres.

### Analytics Service

- Generates OHLCV candles from trade events
- Market statistics and volume
- Price history

Maintains active (in-progress) candles in Redis and flushes completed candles to Postgres. See [Candlestick generation](#candlestick-generation) below.

### Email Service

Transactional email notifications, triggered off the event stream.

### PDF Service

PDF generation (statements, trade confirmations).

## Matching engine

Price-time priority, the same rule every serious order book runs on:

1. Better prices have priority.
2. Orders at the same price are FIFO — oldest first.
3. Trades execute at the **resting** order's price, never the incoming order's price.
4. Partial fills are supported; a single incoming order can generate multiple trades against multiple resting orders.

**Buy orders** consume the lowest available asks:

```
incoming_buy.price >= resting_sell.price
```

**Sell orders** consume the highest available bids:

```
resting_buy.price >= incoming_sell.price
```

**Limit orders** only execute while the matching condition holds; any unfilled remainder rests on the book.

**Market orders** ignore price entirely and consume liquidity until either the requested quantity is filled or the book runs dry. If liquidity runs out, the order is marked `PARTIALLY_FILLED`, the remainder is discarded, and it never rests on the book — a market order that can't fill immediately doesn't become a limit order by accident.

Every execution produces a `Trade`:

```ts
{
  buyOrderId: string;
  sellOrderId: string;
  price: number;   // always the resting order's price
  quantity: number;
  timestamp: Date;
}
```

## Order book

Stored entirely in Redis, two sides per trading pair:

| Book | Sort order |
|---|---|
| Buy | Highest price first, then oldest order first |
| Sell | Lowest price first, then oldest order first |

No order book state lives in Postgres. Postgres has the historical record of what happened; Redis has the current state of what's live.

## Wallets and settlement

Before an order reaches the matching engine, the Primary Backend checks:

- Available balance
- Reserved balance
- Asset ownership

Only validated orders get forwarded. Settlement — the actual balance movement between buyer and seller — happens after the matching engine emits a trade, handled by the Wallet Service consuming `TradeExecuted` events. The engine matches; it doesn't move money.

## Candlestick generation

Candles are generated entirely by the Analytics Service — the matching engine has no concept of a candle, it just emits trades.

For every trade, the Analytics Service buckets it into every timeframe it tracks simultaneously:

```
Trade at 10:07:35 belongs to:
  1m  candle → 10:07
  5m  candle → 10:05
  15m candle → 10:00
  1h  candle → 10:00
```

Each bucket updates open/high/low/close/volume for that trade. Active (still-forming) candles are kept in Redis; once a candle's interval closes, it's flushed to Postgres and a fresh one opens.

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma |
| Cache / in-memory store | Redis |
| Payments | Stripe |
| Auth | JWT |
| Deployment | Docker, PM2 |

## Getting started

```bash
git clone <repo-url>
cd exchangex

# environment
cp .env.example .env
# fill in DATABASE_URL, REDIS_URL, JWT_SECRET, STRIPE_SECRET_KEY, etc.

# infra
docker compose up -d postgres redis

# install + migrate
npm install
npx prisma migrate dev

# run
npm run dev
```

Adjust to match however the services are actually split and started in this repo (single process vs. one command per service) — this is the shape, not a guarantee of the exact scripts.

## Design principles

- Single responsibility per service
- Event-driven communication over direct service-to-service calls
- Asynchronous processing for anything that isn't on the critical matching path
- Deterministic, side-effect-free matching engine
- No database writes inside the matching engine, under any circumstances
- Idempotent event consumers — assume at-least-once delivery and design for it
- Separation of read and write responsibilities

## Status

**Implemented**

- User authentication
- Wallets
- Stripe deposits
- Order placement — limit and market orders
- Price-time priority matching
- Partial fills
- Redis-backed order book
- Trade generation and persistence
- Analytics service
- Candlestick generation
- Email service
- PDF service
- Idempotent event consumers

## Roadmap

Rough order of what's next, not a commitment:

- Stop orders / stop-limit orders
- Iceberg orders
- Margin trading, leverage, liquidation engine, risk engine
- Kafka in place of the current event transport
- Event sourcing
- Order book snapshots + replay engine
- Distributed matching engine, horizontal scaling
- Multi-region deployment
- Observability: OpenTelemetry, Prometheus, Grafana

## License

TBD.