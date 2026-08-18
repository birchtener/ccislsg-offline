-- CreateEnum
CREATE TYPE "GridType" AS ENUM ('AUTO', 'GRID_2X2', 'GRID_3X1', 'SINGLE');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "grid_type" "GridType" NOT NULL DEFAULT 'AUTO';
