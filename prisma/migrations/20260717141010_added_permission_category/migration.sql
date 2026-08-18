/*
  Warnings:

  - Added the required column `category_id` to the `permissions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "permissions" ADD COLUMN     "category_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "permission_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permission_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permission_categories_name_key" ON "permission_categories"("name");

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "permission_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
