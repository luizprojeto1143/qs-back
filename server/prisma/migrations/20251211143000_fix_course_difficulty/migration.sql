-- AlterTable
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "difficulty" TEXT NOT NULL DEFAULT 'Iniciante';
