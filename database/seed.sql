-- Default password for seeded users should be replaced after first login.
-- Hash below is for: Password123!

INSERT INTO users (full_name, email, password_hash, role, department, phone)
VALUES
('System Admin', 'admin@marineprocure.com', '$2a$10$hP5XHL5bgMX1LLSoZ6QR4ulObbLWhS9o9trJ4tvMA3JUlR4xrqUva', 'admin', 'Management', '+2340000000001'),
('Procurement Officer', 'procurement@marineprocure.com', '$2a$10$hP5XHL5bgMX1LLSoZ6QR4ulObbLWhS9o9trJ4tvMA3JUlR4xrqUva', 'procurement', 'Procurement', '+2340000000002'),
('Marine Manager', 'manager@marineprocure.com', '$2a$10$hP5XHL5bgMX1LLSoZ6QR4ulObbLWhS9o9trJ4tvMA3JUlR4xrqUva', 'approver', 'Operations', '+2340000000003'),
('Finance Officer', 'finance@marineprocure.com', '$2a$10$hP5XHL5bgMX1LLSoZ6QR4ulObbLWhS9o9trJ4tvMA3JUlR4xrqUva', 'finance', 'Finance', '+2340000000004'),
('Staff Requester', 'staff@marineprocure.com', '$2a$10$hP5XHL5bgMX1LLSoZ6QR4ulObbLWhS9o9trJ4tvMA3JUlR4xrqUva', 'requester', 'Marine Operations', '+2340000000005')
ON CONFLICT (email) DO NOTHING;

INSERT INTO vendors (company_name, contact_person, email, phone, address, service_category, rating, status)
VALUES
('BluePort Marine Supplies', 'Mr. Kelvin Okafor', 'sales@blueportmarine.com', '+2348011111111', 'Lagos, Nigeria', 'Marine Equipment', 4.80, 'active'),
('OceanFix Nigeria Ltd', 'Mrs. Ada James', 'contact@oceanfix.ng', '+2348022222222', 'Port Harcourt, Nigeria', 'Maintenance Services', 4.50, 'active'),
('SafeSea Logistics', 'Mr. David Eze', 'info@safesea.com', '+2348033333333', 'Warri, Nigeria', 'Logistics', 4.20, 'pending')
ON CONFLICT (email) DO NOTHING;
