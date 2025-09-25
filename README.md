# Breakwaters

Recruitment Management System using React, Node/Express, and MySQL.

## Project Structure
- **client/** - React front end
- **server/** - Express API and business logic

This repository contains the foundational file structure to support role-based authentication, CV submissions, and candidate-company workflows.



## todo
- store users on signup and login to database
- mock home screen
- resume submit (one submit per user)
    - during submit clients can select from large dropdown with search of desired roles, if not found they can input custom entry (which can be reviewed and placed in list for future reference or not)
- status's in the related opportunities card does not change color correctly (Interview pending not yellow)

## todo later
- pursonalized welcome message
- replace the client details status with a more indepth display that show the clients status with each company.
    - minmize the avaliable statuses for the client withing table (simple like: in progress, pending, assigned or rejected ) as more in depth status makes sense only in context of having multiple assignments 
- forget password email
- confirmation email
    - signup
    - resume submit
    - placements (company/client)
- create new table displaying which employees have been suggested or assigned etc to a given company
- filter candidate overview by status
- If client is assigned, interviewed etc. Display companies that they have progressed this far with on details page. (remove stat card to make space for this)
- instead of suggested being said regardless in the related oportunities card, if the client has a different status with the company then it should be updated on the suggested button.
- I like the look of 6 recent assignments. Lets cap it there for scroll.
- candidate view
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
