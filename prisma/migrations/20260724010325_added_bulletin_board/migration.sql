-- CreateTable
CREATE TABLE "bulletin_boards" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100),
    "content" VARCHAR(300),
    "post_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulletin_boards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bulletin_boards_post_id_key" ON "bulletin_boards"("post_id");

-- AddForeignKey
ALTER TABLE "bulletin_boards" ADD CONSTRAINT "bulletin_boards_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
