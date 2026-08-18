/*
  Warnings:

  - You are about to drop the column `type` on the `inventory_categories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "inventory_assets" ADD COLUMN     "serial_number" TEXT;

-- AlterTable
ALTER TABLE "inventory_categories" DROP COLUMN "type",
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "disposal_reason" TEXT,
ADD COLUMN     "disposed_at" TIMESTAMP(3),
ADD COLUMN     "disposed_by" TEXT,
ADD COLUMN     "is_disposed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "item_code" TEXT,
ADD COLUMN     "serial_number" TEXT,
ADD COLUMN     "source_of_fund" TEXT,
ADD COLUMN     "type" "CategoryType" NOT NULL DEFAULT 'SUPPLIES';
