/*
  Warnings:

  - Added the required column `display_username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "display_username" TEXT NOT NULL;
