-- AlterTable: commenters
ALTER TABLE "commenters" ADD COLUMN "userId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "commenters_userId_key" ON "commenters"("userId");

-- AddForeignKey
ALTER TABLE "commenters" ADD CONSTRAINT "commenters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Fix autoincrement sequence (only if table has rows)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM commenters) THEN
    PERFORM setval('commenters_id_seq', (SELECT MAX(id) FROM commenters));
  END IF;
END $$;
