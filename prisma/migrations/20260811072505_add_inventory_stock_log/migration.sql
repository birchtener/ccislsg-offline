-- CreateEnum
CREATE TYPE "StockActionType" AS ENUM ('ADD', 'REDUCE', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "inventory_stock_logs" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action_type" "StockActionType" NOT NULL,
    "quantity_change" INTEGER NOT NULL,
    "previous_quantity" INTEGER NOT NULL,
    "new_quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_stock_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_stock_logs_item_id_idx" ON "inventory_stock_logs"("item_id");

-- CreateIndex
CREATE INDEX "inventory_stock_logs_created_at_idx" ON "inventory_stock_logs"("created_at");

-- AddForeignKey
ALTER TABLE "inventory_stock_logs" ADD CONSTRAINT "inventory_stock_logs_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_stock_logs" ADD CONSTRAINT "inventory_stock_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
