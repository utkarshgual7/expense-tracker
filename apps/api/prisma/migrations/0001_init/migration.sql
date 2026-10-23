-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('food', 'travel', 'bills', 'other');

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" "Category" NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date" DESC);

-- CreateIndex
CREATE INDEX "expenses_category_date_idx" ON "expenses"("category", "date" DESC);


-- Defense in depth: app validates too, but the DB never stores a non-positive amount.
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_amount_positive" CHECK ("amount" > 0);
