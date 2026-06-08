# MarineProcure Admin Guide

MarineProcure is a role-based procurement management portal for marine companies. It supports purchase requests, approval, RFQ, quotations, purchase orders, deliveries, invoices, payments, reports, audit logs, uploads and role-based access.

## User Roles

- Admin: controls users, vendors, settings, reports, documents and audit logs.
- Requester: creates and tracks purchase requests.
- Approver: reviews requests and approves, rejects or requests correction.
- Procurement: creates RFQs, compares quotations, selects vendors and generates purchase orders.
- Vendor: receives RFQs and submits quotations.
- Finance: reviews invoices, records payments and supports financial reports.

## Main Workflow

1. Requester creates a purchase request.
2. Approver or finance reviews and approves/rejects it.
3. Procurement creates an RFQ from an approved request.
4. Vendors submit quotations.
5. Procurement recommends/selects quotation.
6. Purchase order is generated.
7. Delivery is tracked.
8. Invoice is recorded.
9. Finance records payment.
10. The request, PO and invoice can be closed.

## Setup

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Database

Create a PostgreSQL database named `marineprocure`, then run:

```bash
psql -U postgres -d marineprocure -f ../database/schema.sql
psql -U postgres -d marineprocure -f ../database/seed.sql
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Default Test Login

```text
Email: admin@marineprocure.com
Password: Password123!
```

Change this password before production use.

## Uploads

Allowed upload types include PDF, Word, Excel and common image formats. Uploaded files are stored in the configured upload folder and referenced in the database.

## Email Notifications

Set these environment variables to activate email notifications:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=MarineProcure <your_email@gmail.com>
```

## Security Notes

- Use a strong JWT_SECRET in production.
- Enable HTTPS on the live server.
- Keep `.env` files private.
- Restrict database access to trusted hosts only.
- Back up the PostgreSQL database regularly.
- Review audit logs frequently.

## Deployment Checklist

- Set production environment variables.
- Build frontend with `npm run build`.
- Deploy backend on VPS/cloud server.
- Configure reverse proxy with Nginx.
- Enable SSL certificate.
- Point domain/subdomain to server.
- Run database migrations/schema.
- Test all roles before handover.
