-- Add customization fields to categories table
ALTER TABLE "Category" ADD COLUMN "showInMenu" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Category" ADD COLUMN "menuOrder" INTEGER DEFAULT 0;
ALTER TABLE "Category" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Category" ADD COLUMN "menuLabel" TEXT;
