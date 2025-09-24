# Breakwaters

Recruitment Management System using React, Node/Express, and MySQL.

## Project Structure
- **client/** - React front end
- **server/** - Express API and business logic

This repository contains the foundational file structure to support role-based authentication, CV submissions, and candidate-company workflows.

## todo
- implement database display
- mock home screen
- resume submit (one submit per user)
    - during submit clients can select from large dropdown with search of desired roles, if not found they can input custom entry (which can be reviewed and placed in list for future reference or not)
- refine view of candidate etc
    - delete and edit
    - user can do an edit request -> email if confirmed
- create new table displaying which employees have been suggested or assigned etc to a given company
- filter candidate overview by status
## todo later
- forget password email
- confirmation email
    - signup
    - resume submit
    # future
    - placements (company/client)

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
