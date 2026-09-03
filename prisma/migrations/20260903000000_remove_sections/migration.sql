-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_sectionId_fkey";

-- DropIndex
DROP INDEX "posts_sectionId_idx";

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "sectionId";

-- DropTable
DROP TABLE "sections";
