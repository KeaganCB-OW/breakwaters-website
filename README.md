# Breakwaters Recruitment Platform

![Built with React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white) ![Backend Express](https://img.shields.io/badge/Backend-Express-000000?logo=express&logoColor=white) ![Database MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql&logoColor=white) ![Hosted on Hostinger](https://img.shields.io/badge/Frontend%20Hosting-Hostinger-673de6?logo=hostinger&logoColor=white) ![Hosted on Render](https://img.shields.io/badge/API-Render-46E3B7?logo=render&logoColor=white) ![License BSD](https://img.shields.io/badge/License-BSD-blue)

## Overview
Breakwaters Recruitment Platform is a human-centered recruitment management system that connects qualified candidates with verified companies. The application streamlines the full recruitment lifecycle, from initial client intake to company placement, while providing transparency for every stakeholder.

The platform centralizes candidate information, manages CV submissions, and automates communication so teams can collaborate efficiently. Purpose-built dashboards empower clients, recruitment officers, and company representatives to track progress, manage assignments, and make data-informed decisions.

The stack combines a React frontend, Node.js/Express backend, and Hostinger-managed MySQL database, with secure file storage on Cloudflare R2, a frontend hosted on Hostinger, and API services deployed to Render. Authentication is role-based, ensuring each user type accesses the tools and information relevant to their responsibilities.

## Features
### Clients
- Guided onboarding flow with profile creation and document upload
- CV management with Cloudflare R2-backed storage and secure signed URLs
- Real-time recruitment status tracking across company assignments
- Notifications for status updates, interview requests, and feedback

### Recruitment Officers
- Candidate intake review and approval workflows
- Role-based dashboards for monitoring recruitment pipelines
- Assignment management to connect candidates with partner companies
- Automated email notifications via Nodemailer for key lifecycle events
- Bulk status updates and audit-friendly activity history

### Company Representatives
- Curated candidate suggestions with supporting CVs
- Dashboard to monitor interview progress shared by recruitment officers
- Secure document access through expiring Cloudflare R2 links

### Platform & Backend Services
- JWT authentication with bcrypt-secured credentials
- Fine-grained role-based access control across all routes
- RESTful API built with Express.js and documented endpoints
- Cloudflare R2 object storage for CVs and supporting documentation
- Nodemailer email service with Hostinger SMTP integration
- Configurable environment-driven settings for multi-tenant deployments

## Technology Stack
- **Frontend:** React, Vite, Axios, Tailwind CSS (or preferred styling system)
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MySQL with Knex/Prisma query layer (Hostinger managed or self-hosted)
- **Authentication:** JWT with bcrypt password hashing
- **File Storage:** Cloudflare R2 (S3-compatible object storage)
- **Email Delivery:** Nodemailer + Hostinger SMTP
- **Hosting:** Render (API) and Hostinger (frontend + managed MySQL)
- **CI/CD:** GitHub Actions-ready workflow templates (optional)

## Project Structure
```
project-root/
│
├── client/               # React frontend application
├── server/               # Node.js/Express backend services
├── db-upload/            # SQL seeds and data import utilities
├── .env.example          # Root environment template (if required)
├── package.json          # Workspace dependency management
├── README.md
└── SEO_Documentation.md  # Marketing copy and SEO guidelines
```

## Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or yarn package manager
- MySQL Server 8.x (Hostinger managed database or self-hosted equivalent)
- Cloudflare R2 bucket and credentials
- Hostinger account for static hosting and transactional email

### 1️⃣ Clone the repository
```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2️⃣ Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 3️⃣ Configure environment variables
Create `.env` files in both `server/` and `client/` directories based on the examples below.

```
# server/.env
DB_HOST=your-hostinger-db-host
DB_PORT=3306
DB_USER=root
DB_PASS=yourpassword
DB_NAME=breakwaters
DB_SSL=true
JWT_SECRET=your_jwt_secret
TOKEN_EXPIRY=1d
BCRYPT_ROUNDS=12
CLIENT_ORIGIN=http://localhost:3000
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=no-reply@yourdomain.com
MAIL_PASS=your-mail-password
MAIL_FROM="Breakwaters <no-reply@yourdomain.com>"
APP_URL=https://breakwatersrecruitment.co.za
S3_BUCKET=your-bucket-name
S3_ACCOUNT_ID=your-account-id
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=auto
CV_SIGNED_URL_TTL=900
SHARE_LINK_SECRET=optional-share-secret
SHARE_LINK_TTL_SECONDS=3600
TEST_ENDPOINT_TOKEN=optional-test-token
```

```
# client/.env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Breakwaters Recruitment Platform
VITE_SENTRY_DSN=
VITE_ENABLE_ANALYTICS=false
```

### 4️⃣ Run development servers
Use separate terminals for the backend and frontend.

```bash
# Terminal 1 - backend
cd server
npm run dev

# Terminal 2 - frontend
cd client
npm start
```

The development frontend runs on **http://localhost:3000** and the backend API listens on **http://localhost:5000** by default.

## Deployment

### Backend on Render
1. Push the latest code to your GitHub repository.
2. Create a new **Web Service** on Render and connect it to the repository.
3. Set build command to `npm install` (or `yarn install`) and start command to `npm run start` inside the `server` directory.
4. Configure all environment variables under the Render **Environment** tab.
5. Provision a MySQL database (Hostinger managed instance or other external provider) and update connection strings accordingly.
6. Enable automatic deployments from the main branch for continuous delivery.

### Frontend on Hostinger Static Hosting
1. Build the production bundle: `npm run build` inside `/client` (or `npm run build -- --base=/` if using Vite base paths).
2. Upload the generated `client/dist` (or `client/build`) directory to Hostinger using hPanel File Manager, FTP, or Git deploy.
3. Configure rewrite rules (e.g., single-page app fallback to `index.html`) within Hostinger's advanced settings if the frontend relies on client-side routing.
4. Update the frontend environment variables or API URLs (such as `VITE_API_URL`) through Hostinger's hPanel configuration or by injecting them at build time.
5. Enable Hostinger CDN and caching optimizations as needed for global performance.

## Usage
1. **Clients** register accounts, complete intake questionnaires, and upload CVs. They monitor recruitment milestones in a personalized dashboard and receive email notifications for every status change.
2. **Recruitment Officers** log in to review new applicants, verify credentials, and assign candidates to partner companies. Officers manage interview scheduling, send status updates, and maintain data hygiene across the pipeline.
3. **Company Representatives** access curated talent lists matched to their requisitions and download CVs through expiring Cloudflare R2 links. Feedback and hiring decisions are coordinated with recruitment officers through established communication channels.

API consumers can authenticate via JWT and interact with REST endpoints such as:
```http
POST /api/auth/login        # Obtain access and refresh tokens
GET  /api/clients           # List clients (restricted to officer roles)
POST /api/assignments       # Create a company assignment for a client
```

## Environment Variables Reference
| Variable | Description |
| --- | --- |
| `DB_HOST` | Hostinger MySQL database host |
| `DB_PORT` | Port for the MySQL server |
| `DB_USER` | Database user with required privileges |
| `DB_PASS` | Password for the database user |
| `DB_NAME` | Target MySQL database name |
| `DB_SSL` | Enable SSL for database connections |
| `JWT_SECRET` | Secret key for signing JWTs |
| `TOKEN_EXPIRY` | Lifespan of issued JWTs |
| `BCRYPT_ROUNDS` | Cost factor for bcrypt hashing |
| `CLIENT_ORIGIN` | Allowed CORS origin for the frontend |
| `MAIL_HOST` | SMTP host for email delivery |
| `MAIL_PORT` | SMTP port |
| `MAIL_SECURE` | Toggle TLS/SSL for SMTP |
| `MAIL_USER` | SMTP authentication username |
| `MAIL_PASS` | SMTP authentication password |
| `MAIL_FROM` | Default sender name and email |
| `APP_URL` | Public URL of the production site |
| `S3_BUCKET` | Cloudflare R2 bucket storing CVs |
| `S3_ACCOUNT_ID` | Cloudflare account identifier |
| `S3_ACCESS_KEY_ID` | API access key for R2 |
| `S3_SECRET_ACCESS_KEY` | Secret key for R2 access |
| `S3_REGION` | R2 region (often `auto`) |
| `CV_SIGNED_URL_TTL` | Lifetime in seconds for CV download URLs |
| `SHARE_LINK_SECRET` | Optional override secret for share links |
| `SHARE_LINK_TTL_SECONDS` | Lifetime for read-only share links |
| `TEST_ENDPOINT_TOKEN` | Token required to trigger test email hooks |
| `VITE_API_URL` | Frontend base URL for API requests |
| `VITE_APP_NAME` | Frontend display name |
| `VITE_SENTRY_DSN` | Optional Sentry DSN for error monitoring |
| `VITE_ENABLE_ANALYTICS` | Flag to enable analytics tooling |

## Testing & Quality Assurance
- **Database Seeding:** Use scripts in `db-upload/` to seed sample data. Import SQL files via MySQL Workbench or the CLI before running integration tests.
- **Backend Tests:** Run `npm test` (inside `server/`) to execute Jest or Vitest suites covering services, controllers, and utilities.
- **Linting & Type Checks:** Execute `npm run lint` and `npm run typecheck` as configured in `package.json` to ensure code quality.
- **API Smoke Tests:** Use REST clients (Postman/Insomnia) or automated scripts to hit `/api/health` and key endpoints after deployment.

## License
Distributed under the [BSD License](LICENSE). Review `LICENSE` for full terms.

## Acknowledgements
- Hostinger for powering static hosting, managed MySQL, and SMTP services.
- Cloudflare for resilient R2 storage infrastructure.
- Render for seamless API deployment and scaling.
- And last but not Least Tsungai, My amazing Lecturer who has helped me grow as a developer!