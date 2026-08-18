/*
  Warnings:

  - Changed the type of `program` on the `students` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Program" AS ENUM ('BSIT', 'BSIS', 'BSCS');

-- AlterTable
ALTER TABLE "students" DROP COLUMN "program",
ADD COLUMN     "program" "Program" NOT NULL;
