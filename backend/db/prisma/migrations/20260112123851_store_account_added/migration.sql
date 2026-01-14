/*
  Warnings:

  - You are about to drop the column `accountId` on the `Store` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[storeAccountId]` on the table `Store` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `storeAccountId` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Store" DROP CONSTRAINT "Store_accountId_fkey";

-- DropIndex
DROP INDEX "Store_accountId_key";

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "accountId",
ADD COLUMN     "storeAccountId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "StoreAccount" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "role" "Role" NOT NULL DEFAULT 'STORE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreAccount_email_key" ON "StoreAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Store_storeAccountId_key" ON "Store"("storeAccountId");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_storeAccountId_fkey" FOREIGN KEY ("storeAccountId") REFERENCES "StoreAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
