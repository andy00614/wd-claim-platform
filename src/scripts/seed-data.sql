-- 插入费用类型数据
INSERT INTO item_type (name, no) VALUES
('Entertainment', 'A1'),
('IT Services', 'A2'),
('Medical', 'A3'),
('Office', 'B1'),
('Printing', 'B2'),
('Courier', 'B3'),
('Telephone', 'C1'),
('Transportation', 'C2'),
('Travel Intl', 'C3'),
('Training', 'C4')
ON CONFLICT (no) DO NOTHING;

-- 插入货币数据
INSERT INTO currency (name, code) VALUES
('Singapore Dollar', 'SGD'),
('Thai Baht', 'THB'),
('Philippine Peso', 'PHP'),
('Vietnam Dong', 'VND'),
('Chinese Yuan', 'CNY'),
('Indian Rupee', 'INR'),
('Indonesian Rupiah', 'IDR'),
('US Dollar', 'USD'),
('Malaysian Ringgit', 'MYR')
ON CONFLICT (code) DO NOTHING;