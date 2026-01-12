/*
  Warnings:

  - You are about to drop the column `storeAccountId` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the `StoreAccount` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[accountId]` on the table `Store` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountId` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Store" DROP CONSTRAINT "Store_storeAccountId_fkey";

-- DropIndex
DROP INDEX "Store_storeAccountId_key";

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "storeAccountId",
ADD COLUMN     "accountId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "StoreAccount";

-- CreateIndex
CREATE UNIQUE INDEX "Store_accountId_key" ON "Store"("accountId");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
