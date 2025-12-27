-- Add new columns to InventoryItem table
ALTER TABLE "InventoryItem" 
ADD COLUMN IF NOT EXISTS "locationBreakdowns" TEXT,
ADD COLUMN IF NOT EXISTS "usageNotes" TEXT,
ADD COLUMN IF NOT EXISTS "availableForCheckout" INTEGER;
