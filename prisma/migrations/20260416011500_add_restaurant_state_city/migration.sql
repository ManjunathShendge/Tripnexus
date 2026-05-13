-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN "city" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN "state" TEXT;

-- CreateIndex
CREATE INDEX "Restaurant_state_idx" ON "Restaurant"("state");

