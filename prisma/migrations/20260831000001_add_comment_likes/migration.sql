-- AlterTable: Add likes column to comments
ALTER TABLE "comments" ADD COLUMN "likes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "comment_likes" (
    "id" SERIAL NOT NULL,
    "commentId" TEXT NOT NULL,
    "commenterId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_commentId_commenterId_key" ON "comment_likes"("commentId", "commenterId");
CREATE INDEX "comment_likes_commentId_idx" ON "comment_likes"("commentId");
CREATE INDEX "comment_likes_commenterId_idx" ON "comment_likes"("commenterId");

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_commenterId_fkey" FOREIGN KEY ("commenterId") REFERENCES "commenters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
