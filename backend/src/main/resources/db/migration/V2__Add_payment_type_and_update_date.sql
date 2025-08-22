-- Add payment_type column to expenses table
ALTER TABLE expenses ADD COLUMN payment_type VARCHAR(255);

-- Add transaction_date column and migrate existing date data
ALTER TABLE expenses ADD COLUMN transaction_date TIMESTAMP;

-- Copy existing date data to transaction_date (assuming midnight time)
UPDATE expenses SET transaction_date = date AT TIME ZONE 'UTC' WHERE date IS NOT NULL;

-- Drop the old date column
ALTER TABLE expenses DROP COLUMN date;
