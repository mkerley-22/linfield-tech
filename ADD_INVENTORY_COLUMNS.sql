-- Add new columns to InventoryItem table
-- Run this SQL in your Supabase SQL Editor or database management tool

ALTER TABLE "InventoryItem" 
ADD COLUMN IF NOT EXISTS "locationBreakdowns" TEXT,
ADD COLUMN IF NOT EXISTS "usageNotes" TEXT,
ADD COLUMN IF NOT EXISTS "availableForCheckout" INTEGER;

