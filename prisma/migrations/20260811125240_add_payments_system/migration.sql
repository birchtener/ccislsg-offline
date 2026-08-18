/*
  Warnings:

  - You are about to drop the column `item_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `_FeeItemToTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `merch_specs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `fee_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('COMPLETED', 'VOIDED');

-- DropForeignKey
ALTER TABLE "_FeeItemToTransaction" DROP CONSTRAINT "_FeeItemToTransaction_A_fkey";

-- DropForeignKey
ALTER TABLE "_FeeItemToTransaction" DROP CONSTRAINT "_FeeItemToTransaction_B_fkey";

-- DropForeignKey
ALTER TABLE "merch_specs" DROP CONSTRAINT "merch_specs_item_id_fkey";

-- AlterTable
ALTER TABLE "fee_items" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "has_variants" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "item_id",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "payment_method" TEXT NOT NULL DEFAULT 'CASH',
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "total_amount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "_FeeItemToTransaction";

-- DropTable
DROP TABLE "merch_specs";

-- CreateTable
CREATE TABLE "fee_item_variants" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_item_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_item_stock_logs" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "action_type" "StockActionType" NOT NULL,
    "quantity_change" INTEGER NOT NULL,
    "previous_quantity" INTEGER NOT NULL,
    "new_quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_item_stock_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_items" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fee_item_variants_item_id_idx" ON "fee_item_variants"("item_id");

-- CreateIndex
CREATE INDEX "fee_item_stock_logs_item_id_idx" ON "fee_item_stock_logs"("item_id");

-- CreateIndex
CREATE INDEX "fee_item_stock_logs_created_at_idx" ON "fee_item_stock_logs"("created_at");

-- CreateIndex
CREATE INDEX "transactions_student_id_idx" ON "transactions"("student_id");

-- CreateIndex
CREATE INDEX "transactions_staff_id_idx" ON "transactions"("staff_id");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");

-- AddForeignKey
ALTER TABLE "fee_items" ADD CONSTRAINT "fee_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_item_variants" ADD CONSTRAINT "fee_item_variants_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "fee_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_item_stock_logs" ADD CONSTRAINT "fee_item_stock_logs_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "fee_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_item_stock_logs" ADD CONSTRAINT "fee_item_stock_logs_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "fee_item_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_item_stock_logs" ADD CONSTRAINT "fee_item_stock_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "fee_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "fee_item_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
