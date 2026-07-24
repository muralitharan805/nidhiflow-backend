-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "finance";

-- CreateEnum
CREATE TYPE "finance"."AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "finance"."PostingType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "finance"."accounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "finance"."AccountType" NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."journal_entries" (
    "id" TEXT NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'POSTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."journal_postings" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "finance"."PostingType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."loan_amortizations" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "principalAmount" DOUBLE PRECISION NOT NULL,
    "annualInterestRate" DOUBLE PRECISION NOT NULL,
    "tenureMonths" INTEGER NOT NULL,
    "monthlyEmi" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "payoffDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_amortizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."forecasting_scenarios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initialAnnualIncome" DOUBLE PRECISION NOT NULL,
    "incomeGrowthRate" DOUBLE PRECISION NOT NULL,
    "projectionYears" INTEGER NOT NULL DEFAULT 5,
    "categoryInflations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forecasting_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_code_key" ON "finance"."accounts"("code");

-- CreateIndex
CREATE INDEX "accounts_type_idx" ON "finance"."accounts"("type");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_entryNumber_key" ON "finance"."journal_entries"("entryNumber");

-- CreateIndex
CREATE INDEX "journal_entries_transactionDate_idx" ON "finance"."journal_entries"("transactionDate" DESC);

-- CreateIndex
CREATE INDEX "journal_postings_accountId_idx" ON "finance"."journal_postings"("accountId");

-- AddForeignKey
ALTER TABLE "finance"."accounts" ADD CONSTRAINT "accounts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "finance"."accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."journal_postings" ADD CONSTRAINT "journal_postings_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "finance"."journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."journal_postings" ADD CONSTRAINT "journal_postings_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "finance"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."loan_amortizations" ADD CONSTRAINT "loan_amortizations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "finance"."accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
