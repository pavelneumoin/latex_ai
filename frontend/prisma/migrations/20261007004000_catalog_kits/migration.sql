ALTER TABLE "Product" ADD COLUMN "examTask" INTEGER;
ALTER TABLE "Product" ADD COLUMN "topic" TEXT;
ALTER TABLE "Product" ADD COLUMN "subtopic" TEXT;
ALTER TABLE "Product" ADD COLUMN "compositionJson" TEXT;
ALTER TABLE "Product" ADD COLUMN "diskFolderUrl" TEXT;
ALTER TABLE "Product" ADD COLUMN "bundleTier" TEXT NOT NULL DEFAULT 'basic';
ALTER TABLE "Product" ADD COLUMN "previewLabelsJson" TEXT;
