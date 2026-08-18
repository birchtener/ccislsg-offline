/*
  Warnings:

  - A unique constraint covering the columns `[post_id,order]` on the table `post_images` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "post_images" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "post_images_post_id_order_key" ON "post_images"("post_id", "order");
