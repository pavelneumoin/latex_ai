PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "username" TEXT,
    "emailVerified" DATETIME,
    "name" TEXT,
    "image" TEXT,
    "passwordHash" TEXT,
    "school" TEXT,
    "subjects" TEXT,
    "grades" TEXT,
    "logoPath" TEXT,
    "watermark" TEXT,
    "accentColor" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" TEXT NOT NULL DEFAULT 'active',
    "libraryAccessForever" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("accentColor", "createdAt", "email", "emailVerified", "grades", "id", "image", "logoPath", "name", "passwordHash", "role", "school", "status", "subjects", "updatedAt", "watermark") SELECT "accentColor", "createdAt", "email", "emailVerified", "grades", "id", "image", "logoPath", "name", "passwordHash", "role", "school", "status", "subjects", "updatedAt", "watermark" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_email_idx" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
