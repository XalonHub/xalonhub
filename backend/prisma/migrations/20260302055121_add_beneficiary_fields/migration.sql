-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "beneficiaryName" TEXT,
ADD COLUMN     "beneficiaryPhone" TEXT,
ADD COLUMN     "partnerConfirmedReceipt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentDetails" JSONB,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN     "serviceGender" TEXT;

-- AlterTable
ALTER TABLE "PartnerProfile" ADD COLUMN     "softLockBookingId" TEXT,
ADD COLUMN     "softLockUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SavedAddress" ADD COLUMN     "district" TEXT,
ADD COLUMN     "state" TEXT;
