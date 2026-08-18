-- CreateEnum
CREATE TYPE "LostFoundStatus" AS ENUM ('UNCLAIMED', 'CLAIMED');

-- CreateTable
CREATE TABLE "lost_found_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "location_found" TEXT,
    "date_found" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "LostFoundStatus" NOT NULL DEFAULT 'UNCLAIMED',
    "claimed_by" TEXT,
    "claimed_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lost_found_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lost_found_images" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "public_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lost_found_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lost_found_images_item_id_idx" ON "lost_found_images"("item_id");

-- AddForeignKey
ALTER TABLE "lost_found_items" ADD CONSTRAINT "lost_found_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_found_images" ADD CONSTRAINT "lost_found_images_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "lost_found_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
