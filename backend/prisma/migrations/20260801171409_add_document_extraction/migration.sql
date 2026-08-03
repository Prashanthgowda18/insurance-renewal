-- CreateTable
CREATE TABLE "document_extractions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pdfUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agencyId" TEXT NOT NULL,
    CONSTRAINT "document_extractions_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
