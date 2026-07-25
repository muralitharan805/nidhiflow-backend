-- AlterTable
ALTER TABLE "finance"."accounts" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "finance"."journal_entries" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "accounts_userId_type_idx" ON "finance"."accounts"("userId", "type");

-- CreateIndex
CREATE INDEX "journal_entries_userId_transactionDate_idx" ON "finance"."journal_entries"("userId", "transactionDate" DESC);

-- AddForeignKey
ALTER TABLE "finance"."accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."journal_entries" ADD CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
