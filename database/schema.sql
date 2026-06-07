CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(40) NOT NULL CHECK (role IN ('admin', 'requester', 'approver', 'procurement', 'vendor', 'finance')),
  department VARCHAR(120),
  phone VARCHAR(40),
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(180) NOT NULL,
  contact_person VARCHAR(150),
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(40),
  address TEXT,
  service_category VARCHAR(120),
  tax_id VARCHAR(100),
  bank_name VARCHAR(120),
  account_name VARCHAR(150),
  account_number VARCHAR(50),
  rating NUMERIC(3,2) DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'blacklisted')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_no VARCHAR(40) UNIQUE NOT NULL,
  requester_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(220) NOT NULL,
  category VARCHAR(120) NOT NULL,
  vessel_or_department VARCHAR(150),
  priority VARCHAR(30) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  required_date DATE,
  estimated_budget NUMERIC(14,2) DEFAULT 0,
  description TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'correction_requested', 'rfq_created', 'vendor_selected', 'po_issued', 'delivered', 'invoiced', 'closed')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit VARCHAR(40),
  estimated_unit_price NUMERIC(14,2) DEFAULT 0,
  description TEXT
);

CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  decision VARCHAR(30) NOT NULL CHECK (decision IN ('approved', 'rejected', 'correction_requested')),
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_no VARCHAR(40) UNIQUE NOT NULL,
  request_id UUID NOT NULL REFERENCES purchase_requests(id) ON DELETE CASCADE,
  title VARCHAR(220) NOT NULL,
  deadline DATE NOT NULL,
  requirements TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'awarded', 'cancelled')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfq_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (rfq_id, vendor_id)
);

CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_no VARCHAR(40) UNIQUE NOT NULL,
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  delivery_time VARCHAR(100),
  validity_period VARCHAR(100),
  payment_terms TEXT,
  warranty TEXT,
  notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'recommended', 'accepted', 'rejected')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_no VARCHAR(40) UNIQUE NOT NULL,
  request_id UUID REFERENCES purchase_requests(id) ON DELETE SET NULL,
  quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  delivery_address TEXT,
  delivery_deadline DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'pending_delivery', 'partially_delivered', 'delivered', 'closed', 'cancelled')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  received_by UUID REFERENCES users(id) ON DELETE SET NULL,
  delivery_status VARCHAR(40) NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'in_transit', 'partially_delivered', 'delivered', 'verified')),
  delivery_note_url TEXT,
  comment TEXT,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no VARCHAR(80) UNIQUE NOT NULL,
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  invoice_url TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'verified', 'payment_pending', 'paid', 'rejected')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  payment_reference VARCHAR(120),
  payment_status VARCHAR(40) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80),
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_requester ON purchase_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
