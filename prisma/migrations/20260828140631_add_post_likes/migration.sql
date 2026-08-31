-- CreateTable
CREATE TABLE "post_likes" (
    "id" SERIAL NOT NULL,
    "postId" TEXT NOT NULL,
    "commenterId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_postId_commenterId_key" ON "post_likes"("postId", "commenterId");
CREATE INDEX "post_likes_postId_idx" ON "post_likes"("postId");
CREATE INDEX "post_likes_commenterId_idx" ON "post_likes"("commenterId");

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_commenterId_fkey" FOREIGN KEY ("commenterId") REFERENCES "commenters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
