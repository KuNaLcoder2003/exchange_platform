-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('LIMIT_ORDER', 'MARKET_ORDER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_ate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "inr_balance" DECIMAL(20,8) NOT NULL,
    "inr_locked" DECIMAL(20,8) NOT NULL,
    "usdt_balance" DECIMAL(20,8) NOT NULL,
    "usdt_locked" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_ate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orders" (
    "id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL,
    "remaining_quantity" DECIMAL(20,8) NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "side" "OrderSide" NOT NULL,
    "type" "OrderType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "buy_order_id" TEXT NOT NULL,
    "sell_order_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_user_id_key" ON "Wallet"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Orders_idempotency_key_key" ON "Orders"("idempotency_key");

-- CreateIndex
CREATE INDEX "Orders_status_idx" ON "Orders"("status");

-- CreateIndex
CREATE INDEX "Orders_side_idx" ON "Orders"("side");

-- CreateIndex
CREATE INDEX "Orders_created_at_idx" ON "Orders"("created_at");

-- CreateIndex
CREATE INDEX "Orders_user_id_idx" ON "Orders"("user_id");

-- CreateIndex
CREATE INDEX "Orders_price_idx" ON "Orders"("price");

-- CreateIndex
CREATE INDEX "Trade_buy_order_id_idx" ON "Trade"("buy_order_id");

-- CreateIndex
CREATE INDEX "Trade_sell_order_id_idx" ON "Trade"("sell_order_id");

-- CreateIndex
CREATE INDEX "Trade_completed_at_idx" ON "Trade"("completed_at");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_buy_order_id_fkey" FOREIGN KEY ("buy_order_id") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_sell_order_id_fkey" FOREIGN KEY ("sell_order_id") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
