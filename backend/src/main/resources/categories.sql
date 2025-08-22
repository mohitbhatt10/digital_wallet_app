-- Insert predefined hierarchical categories (owner_id = null indicates system-defined)
-- Only insert if categories table is empty to avoid duplicates on restart

-- First insert main categories (only if no categories exist)
INSERT INTO categories (name, parent_id, owner_id) 
SELECT 'Food & Dining', CAST(null AS bigint), CAST(null AS bigint) WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1)
UNION ALL
SELECT 'Transportation', CAST(null AS bigint), CAST(null AS bigint) WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1)
UNION ALL
SELECT 'Healthcare', CAST(null AS bigint), CAST(null AS bigint) WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1)
UNION ALL
SELECT 'Shopping', CAST(null AS bigint), CAST(null AS bigint) WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1)
UNION ALL
SELECT 'Entertainment', CAST(null AS bigint), CAST(null AS bigint) WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1)
UNION ALL
SELECT 'Housing', CAST(null AS bigint), CAST(null AS bigint) WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1)
UNION ALL
SELECT 'Financial', CAST(null AS bigint), CAST(null AS bigint) WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1)
UNION ALL
SELECT 'Business', CAST(null AS bigint), CAST(null AS bigint) WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1)
UNION ALL
SELECT 'Personal', CAST(null AS bigint), CAST(null AS bigint) WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- Then insert sub-categories (only if main categories exist and sub-categories don't exist)
INSERT INTO categories (name, parent_id, owner_id) 
SELECT 'Groceries', (SELECT id FROM categories WHERE name = 'Food & Dining' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Food & Dining' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Groceries')
UNION ALL
SELECT 'Restaurants', (SELECT id FROM categories WHERE name = 'Food & Dining' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Food & Dining' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Restaurants')
UNION ALL
SELECT 'Coffee & Snacks', (SELECT id FROM categories WHERE name = 'Food & Dining' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Food & Dining' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Coffee & Snacks')
UNION ALL
SELECT 'Gas/Fuel', (SELECT id FROM categories WHERE name = 'Transportation' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Transportation' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Gas/Fuel')
UNION ALL
SELECT 'Public Transport', (SELECT id FROM categories WHERE name = 'Transportation' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Transportation' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Public Transport')
UNION ALL
SELECT 'Car Maintenance', (SELECT id FROM categories WHERE name = 'Transportation' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Transportation' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Car Maintenance')
UNION ALL
SELECT 'Parking', (SELECT id FROM categories WHERE name = 'Transportation' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Transportation' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Parking')
UNION ALL
SELECT 'Rideshare/Taxi', (SELECT id FROM categories WHERE name = 'Transportation' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Transportation' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Rideshare/Taxi')
UNION ALL
SELECT 'Medical', (SELECT id FROM categories WHERE name = 'Healthcare' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Healthcare' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Medical')
UNION ALL
SELECT 'Pharmacy', (SELECT id FROM categories WHERE name = 'Healthcare' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Healthcare' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pharmacy')
UNION ALL
SELECT 'Dental', (SELECT id FROM categories WHERE name = 'Healthcare' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Healthcare' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Dental')
UNION ALL
SELECT 'Insurance', (SELECT id FROM categories WHERE name = 'Healthcare' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Healthcare' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Insurance')
UNION ALL
SELECT 'Clothing', (SELECT id FROM categories WHERE name = 'Shopping' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Shopping' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Clothing')
UNION ALL
SELECT 'Electronics', (SELECT id FROM categories WHERE name = 'Shopping' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Shopping' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Electronics')
UNION ALL
SELECT 'Household Items', (SELECT id FROM categories WHERE name = 'Shopping' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Shopping' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Household Items')
UNION ALL
SELECT 'Movies & Streaming', (SELECT id FROM categories WHERE name = 'Entertainment' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Entertainment' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Movies & Streaming')
UNION ALL
SELECT 'Sports & Fitness', (SELECT id FROM categories WHERE name = 'Entertainment' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Entertainment' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Sports & Fitness')
UNION ALL
SELECT 'Books & Education', (SELECT id FROM categories WHERE name = 'Entertainment' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Entertainment' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Books & Education')
UNION ALL
SELECT 'Travel', (SELECT id FROM categories WHERE name = 'Entertainment' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Entertainment' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Travel')
UNION ALL
SELECT 'Rent/Mortgage', (SELECT id FROM categories WHERE name = 'Housing' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Housing' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Rent/Mortgage')
UNION ALL
SELECT 'Utilities', (SELECT id FROM categories WHERE name = 'Housing' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Housing' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Utilities')
UNION ALL
SELECT 'Internet & Phone', (SELECT id FROM categories WHERE name = 'Housing' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Housing' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Internet & Phone')
UNION ALL
SELECT 'Bank Fees', (SELECT id FROM categories WHERE name = 'Financial' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Financial' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Bank Fees')
UNION ALL
SELECT 'Subscriptions', (SELECT id FROM categories WHERE name = 'Financial' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Financial' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Subscriptions')
UNION ALL
SELECT 'Personal Care', (SELECT id FROM categories WHERE name = 'Personal' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Personal' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Personal Care')
UNION ALL
SELECT 'Gifts', (SELECT id FROM categories WHERE name = 'Personal' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Personal' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Gifts')
UNION ALL
SELECT 'Charity/Donations', (SELECT id FROM categories WHERE name = 'Personal' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Personal' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Charity/Donations')
UNION ALL
SELECT 'Business Meals', (SELECT id FROM categories WHERE name = 'Business' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Business' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Business Meals')
UNION ALL
SELECT 'Office Supplies', (SELECT id FROM categories WHERE name = 'Business' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Business' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Office Supplies')
UNION ALL
SELECT 'Professional Services', (SELECT id FROM categories WHERE name = 'Business' AND owner_id IS NULL), CAST(null AS bigint)
WHERE EXISTS (SELECT 1 FROM categories WHERE name = 'Business' AND owner_id IS NULL) 
AND NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Professional Services');
