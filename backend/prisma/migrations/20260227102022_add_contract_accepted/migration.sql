-- AlterTable
ALTER TABLE "PartnerProfile" ADD COLUMN     "contractAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contractAcceptedAt" TIMESTAMP(3);
