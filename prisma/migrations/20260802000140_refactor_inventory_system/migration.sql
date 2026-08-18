/*
  Warnings:

  - You are about to drop the `inventory_item_conditions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('PROPERTY', 'EQUIPMENT', 'SUPPLIES');

-- CreateEnum
CREATE TYPE "AssetItemStatus" AS ENUM ('AVAILABLE', 'BORROWED', 'MAINTENANCE', 'LOST', 'DISPOSED');

-- DropForeignKey
ALTER TABLE "inventory_item_conditions" DROP CONSTRAINT "inventory_item_conditions_item_id_fkey";

-- AlterTable
ALTER TABLE "inventory_borrowers" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "remarks" DROP NOT NULL;

-- AlterTable
ALTER TABLE "inventory_borrows" ADD COLUMN     "asset_id" TEXT,
ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "remarks" TEXT,
ALTER COLUMN "quantity" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "inventory_categories" ADD COLUMN     "type" "CategoryType" NOT NULL DEFAULT 'SUPPLIES';

-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "description" TEXT,
ALTER COLUMN "quantity" SET DEFAULT 0;

-- DropTable
DROP TABLE "inventory_item_conditions";

-- CreateTable
CREATE TABLE "inventory_assets" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "asset_tag" TEXT NOT NULL,
    "qr_code" TEXT NOT NULL,
    "status" "AssetItemStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition" TEXT NOT NULL DEFAULT 'Good',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_assets_asset_tag_key" ON "inventory_assets"("asset_tag");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_assets_qr_code_key" ON "inventory_assets"("qr_code");

-- AddForeignKey
ALTER TABLE "inventory_assets" ADD CONSTRAINT "inventory_assets_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_borrows" ADD CONSTRAINT "inventory_borrows_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "inventory_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_borrows" ADD CONSTRAINT "inventory_borrows_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
