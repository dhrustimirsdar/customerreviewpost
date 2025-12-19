/*
  # Add Phone Number and Tracking ID to Complaints

  1. Changes
    - Add `phone_number` column (text, nullable) - User's phone number for contact
    - Add `tracking_id` column (text, nullable) - Package/shipment tracking ID reference
    
  2. Notes
    - Both fields are optional to maintain backward compatibility
    - Existing complaints will have null values for these fields
    - New complaints can include these fields for better tracking and communication
*/

-- Add phone number column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE complaints ADD COLUMN phone_number text;
  END IF;
END $$;

-- Add tracking ID column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'tracking_id'
  ) THEN
    ALTER TABLE complaints ADD COLUMN tracking_id text;
  END IF;
END $$;

-- Create index for tracking_id to allow quick lookups
CREATE INDEX IF NOT EXISTS complaints_tracking_id_idx ON complaints(tracking_id) WHERE tracking_id IS NOT NULL;