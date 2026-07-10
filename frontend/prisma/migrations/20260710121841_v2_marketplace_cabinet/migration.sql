-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "course" TEXT,
    "courseSlug" TEXT,
    "lessonNo" INTEGER,
    "audience" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'lesson_kit',
    "priceBasic" INTEGER NOT NULL DEFAULT 4900,
    "priceSource" INTEGER,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "previewPath" TEXT,
    "pages" INTEGER,
    "checkable" BOOLEAN NOT NULL DEFAULT false,
    "answerKeyJson" TEXT,
    "checkInstructions" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'basic',
    "label" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER,
    "pages" INTEGER,
    "sortKey" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'basic',
    "pricePaid" INTEGER NOT NULL DEFAULT 0,
    "paymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Purchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT 'math',
    "gradeLevel" INTEGER,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "scale5" INTEGER NOT NULL DEFAULT 85,
    "scale4" INTEGER NOT NULL DEFAULT 65,
    "scale3" INTEGER NOT NULL DEFAULT 40,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Class_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortKey" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "classId" TEXT,
    "productId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "totalTasks" INTEGER,
    "maxScore" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CheckJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CheckJob_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CheckJob_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "answersJson" TEXT NOT NULL DEFAULT '[]',
    "score" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 0,
    "pct" REAL NOT NULL DEFAULT 0,
    "mark" INTEGER,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "absent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CheckResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "CheckJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CheckResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "jobId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "texPath" TEXT,
    "pdfPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "CheckJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL DEFAULT 'all',
    "tier" TEXT NOT NULL DEFAULT 'basic',
    "priceMonthly" INTEGER NOT NULL,
    "priceYearly" INTEGER NOT NULL DEFAULT 0,
    "worksheetsLimit" INTEGER NOT NULL,
    "variantsLimit" INTEGER NOT NULL,
    "checksLimit" INTEGER NOT NULL,
    "marketplaceCommissionPct" INTEGER NOT NULL DEFAULT 20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Plan" ("checksLimit", "createdAt", "description", "id", "isActive", "marketplaceCommissionPct", "name", "priceMonthly", "updatedAt", "variantsLimit", "worksheetsLimit") SELECT "checksLimit", "createdAt", "description", "id", "isActive", "marketplaceCommissionPct", "name", "priceMonthly", "updatedAt", "variantsLimit", "worksheetsLimit" FROM "Plan";
DROP TABLE "Plan";
ALTER TABLE "new_Plan" RENAME TO "Plan";
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT 'all',
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" DATETIME NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "usedWorksheets" INTEGER NOT NULL DEFAULT 0,
    "usedVariants" INTEGER NOT NULL DEFAULT 0,
    "usedChecks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Subscription" ("cancelAtPeriodEnd", "createdAt", "currentPeriodEnd", "currentPeriodStart", "id", "planId", "status", "updatedAt", "usedChecks", "usedVariants", "usedWorksheets", "userId") SELECT "cancelAtPeriodEnd", "createdAt", "currentPeriodEnd", "currentPeriodStart", "id", "planId", "status", "updatedAt", "usedChecks", "usedVariants", "usedWorksheets", "userId" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE UNIQUE INDEX "Subscription_userId_subject_key" ON "Subscription"("userId", "subject");
CREATE TABLE "new_Upload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "worksheetId" TEXT,
    "checkJobId" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "extractedText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Upload_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "Worksheet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Upload_checkJobId_fkey" FOREIGN KEY ("checkJobId") REFERENCES "CheckJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Upload" ("createdAt", "extractedText", "filename", "id", "mimeType", "path", "purpose", "size", "userId", "worksheetId") SELECT "createdAt", "extractedText", "filename", "id", "mimeType", "path", "purpose", "size", "userId", "worksheetId" FROM "Upload";
DROP TABLE "Upload";
ALTER TABLE "new_Upload" RENAME TO "Upload";
CREATE INDEX "Upload_userId_createdAt_idx" ON "Upload"("userId", "createdAt");
CREATE INDEX "Upload_checkJobId_idx" ON "Upload"("checkJobId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_subject_isPublished_idx" ON "Product"("subject", "isPublished");

-- CreateIndex
CREATE INDEX "Product_courseSlug_lessonNo_idx" ON "Product"("courseSlug", "lessonNo");

-- CreateIndex
CREATE INDEX "ProductAsset_productId_tier_idx" ON "ProductAsset"("productId", "tier");

-- CreateIndex
CREATE INDEX "Purchase_userId_createdAt_idx" ON "Purchase"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_userId_productId_key" ON "Purchase"("userId", "productId");

-- CreateIndex
CREATE INDEX "Class_userId_archived_idx" ON "Class"("userId", "archived");

-- CreateIndex
CREATE INDEX "Student_classId_sortKey_idx" ON "Student"("classId", "sortKey");

-- CreateIndex
CREATE INDEX "CheckJob_userId_createdAt_idx" ON "CheckJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CheckResult_jobId_idx" ON "CheckResult"("jobId");

-- CreateIndex
CREATE INDEX "Report_userId_createdAt_idx" ON "Report"("userId", "createdAt");
