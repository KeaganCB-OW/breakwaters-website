# Breakwaters

Recruitment Management System using React, Node/Express, and MySQL.

## Project Structure
- **client/** - React front end
- **server/** - Express API and business logic

This repository contains the foundational file structure to support role-based authentication, CV submissions, and candidate-company workflows.

## Email & Notification Configuration
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM` - Hostinger SMTP settings used by the reusable mailer utility.
- `APP_URL` - Public URL for building call-to-action links in mail templates.
- `SHARE_LINK_SECRET` *(optional)* - Secret for signing read-only client share tokens (falls back to `JWT_SECRET`).
- `SHARE_LINK_TTL_SECONDS` *(optional)* - Lifetime for read-only links (defaults to 3600 seconds).
- `CV_SIGNED_URL_TTL` *(optional)* - Lifetime (in seconds) for generated CV presigned URLs (defaults to 900 seconds).
- `TEST_ENDPOINT_TOKEN` *(optional)* - When set, enables guarded `/api/test-hooks/...` endpoints for triggering notification emails in non-production environments.

### Testing Notification Emails
Set `TEST_ENDPOINT_TOKEN`, then call:
- `POST /api/test-hooks/emails/client-status` with `{"clientId": 1, "statusNew": "in progress"}` to simulate the client status update email.
- `POST /api/test-hooks/emails/client-suggested` with `{"assignmentId": 1}` (or `clientId` + `companyId`) to trigger the company notification email.

Include the matching token in the `x-test-token` header (or `token` query/body param). These endpoints run only when the token is configured.

## todo
- store users on signup and login to database
- mock home screen
- resume submit (one submit per user)
    - during submit clients can select from large dropdown with search of desired roles, if not found they can input custom entry (which can be reviewed and placed in list for future reference or not)
- status's in the related opportunities card does not change color correctly (Interview pending not yellow)
- edit "forbidden" error when not logged in as a RO when editing to some text that is nice to look at
- pursonalized welcome message (add name column to users)
- replace the client details status with a more indepth display that show the clients status with each company.
    - minmize the avaliable statuses for the client withing table (simple like: in progress, pending, assigned or rejected ) as more in depth status makes sense only in context of having multiple assignments 
- create new table displaying which employees have been suggested or assigned etc to a given company (client details)
- If client is assigned, interviewed etc. Display companies that they have progressed this far with on details page. (remove stat card to make space for this)
- filter candidate overview by status
- I like the look of 6 recent assignments. Lets cap it there for scroll.

## todo later
- forget password email
- confirmation email
    - signup
    - resume submit
    - placements (company/client)
- candidate view dashboard
    - user can do an edit request -> email if confirmed

## Connecting to MySQL via XAMPP
1. Start Apache and MySQL in the XAMPP Control Panel.
2. Open phpMyAdmin (http://localhost/phpmyadmin) and create a database (for example `breakwaters`). Import your schema or tables if you have them exported already.
3. Copy `server/.env.example` to `server/.env` and update the values to match your XAMPP MySQL credentials (default user is `root` with no password) and set `CLIENT_ORIGIN` to your React app URL (usually `http://localhost:3000`).
4. Install dependencies and start the API:

```
cd server
npm install
npm run dev
```

5. Visit http://localhost:5000/api/health/db to confirm the backend can reach the database.

If the health endpoint fails, double-check that the MySQL service is running, the credentials in `.env` are correct, and the database exists.
