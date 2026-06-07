# MarineProcure Full-Stack Web App

MarineProcure is a real deployable procurement management web application for a marine company.

The system is designed to manage purchase requests, approvals, vendors, RFQs, quotations, purchase orders, deliveries, invoices, payments, reports, and audit logs.

## Project Structure

```bash
marine-procurement-frontend/
├── frontend/   # React + Vite client app
├── backend/    # Node.js + Express REST API
├── database/   # PostgreSQL schema and seed files
└── docs/       # Project notes and documentation
```

## Core Roles

- Admin
- Requester / Staff
- Approver / Manager
- Procurement Officer
- Vendor / Supplier
- Finance

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Plain CSS

### Backend

- Node.js
- Express.js
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- Multer for uploads
- Nodemailer for email notifications
- PDF generation for purchase orders and reports

### Database

- PostgreSQL
- SQL schema and seed records

## Local Development

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

Backend API runs on:

```bash
http://localhost:5000/api
```

## First Build Phase

- Backend API setup
- PostgreSQL schema
- JWT auth and roles
- Frontend login connected to backend
- Admin dashboard
- Purchase request module
- Vendor module
