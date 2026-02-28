-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'Admin';

-- AlterTable
ALTER TABLE "PartnerProfile" ADD COLUMN     "kycRejectedReason" TEXT,
ADD COLUMN     "kycStatus" TEXT NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;
