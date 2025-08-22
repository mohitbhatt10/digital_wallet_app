-- Insert predefined system categories (owner = null indicates system-defined)
-- Only insert if categories table is empty to avoid duplicates on restart
INSERT INTO categories (name, type, owner) 
SELECT * FROM (VALUES 
-- Essential Living
('Groceries', 'FOOD', null),
('Restaurants', 'FOOD', null),
('Coffee & Snacks', 'FOOD', null),
('Rent/Mortgage', 'HOUSING', null),
('Utilities', 'HOUSING', null),
('Internet & Phone', 'UTILITIES', null),

-- Transportation
('Gas/Fuel', 'TRANSPORT', null),
('Public Transport', 'TRANSPORT', null),
('Car Maintenance', 'TRANSPORT', null),
('Parking', 'TRANSPORT', null),
('Rideshare/Taxi', 'TRANSPORT', null),

-- Healthcare
('Medical', 'HEALTH', null),
('Pharmacy', 'HEALTH', null),
('Dental', 'HEALTH', null),
('Insurance', 'INSURANCE', null),

-- Shopping & Personal
('Clothing', 'SHOPPING', null),
('Electronics', 'SHOPPING', null),
('Personal Care', 'PERSONAL', null),
('Household Items', 'HOUSEHOLD', null),

-- Entertainment & Lifestyle
('Entertainment', 'ENTERTAINMENT', null),
('Movies & Streaming', 'ENTERTAINMENT', null),
('Sports & Fitness', 'HEALTH', null),
('Books & Education', 'EDUCATION', null),
('Travel', 'TRAVEL', null),

-- Financial
('Bank Fees', 'FINANCIAL', null),
('Subscriptions', 'SUBSCRIPTION', null),
('Gifts', 'GIFTS', null),
('Charity/Donations', 'CHARITY', null),

-- Work Related
('Business Meals', 'BUSINESS', null),
('Office Supplies', 'BUSINESS', null),
('Professional Services', 'BUSINESS', null),

-- Miscellaneous
('Other', 'OTHER', null)
) AS tmp(name, type, owner)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE owner IS NULL LIMIT 1);
