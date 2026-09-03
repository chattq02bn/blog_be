-- AlterTable
ALTER TABLE "posts" ADD COLUMN "sidebarId" TEXT;

-- CreateIndex
CREATE INDEX "posts_sidebarId_idx" ON "posts"("sidebarId");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_sidebarId_fkey" FOREIGN KEY ("sidebarId") REFERENCES "sidebar_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
