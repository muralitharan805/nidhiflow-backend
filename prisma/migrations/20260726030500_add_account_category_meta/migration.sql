-- CreateTable
CREATE TABLE "finance"."account_category_meta" (
    "type" "finance"."AccountType" NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "colorClass" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_category_meta_pkey" PRIMARY KEY ("type")
);
