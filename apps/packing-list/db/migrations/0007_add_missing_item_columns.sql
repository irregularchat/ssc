-- Migration: Add missing columns for packing list items structure
-- Matches Django schema for sections, requirements, and instructions

ALTER TABLE packing_list_items ADD COLUMN section TEXT DEFAULT 'General';
ALTER TABLE packing_list_items ADD COLUMN required INTEGER DEFAULT 1; -- Boolean 1/0
ALTER TABLE packing_list_items ADD COLUMN instructions TEXT;
ALTER TABLE packing_list_items ADD COLUMN nsn_lin TEXT; -- National Stock Number / Line Item Number
ALTER TABLE packing_list_items ADD COLUMN packed INTEGER DEFAULT 0; -- Boolean 1/0 (for user lists)
