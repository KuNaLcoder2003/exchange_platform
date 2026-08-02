-- CreateEnum
CREATE TYPE "Transaction_Type" AS ENUM ('WALLET_TOPUP', 'WALLET_WITHDRAW');

-- CreateEnum
CREATE TYPE "Transaction_Status" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Transactions" (
    "id" TEXT NOT NULL,
    "stripe_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "Transaction_Type" NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "Transaction_Status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_ate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transactions_stripe_id_key" ON "Transactions"("stripe_id");

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
