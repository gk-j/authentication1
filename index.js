const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//registered API
app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = bcrypt.hash(password, 10);
  const selectuserQuery = `
   SELECT *
   FROM user
   WHERE 
   username='${username}'`;
  const dbUser = await db.get(selectuserQuery);

  if (dbUser == undefined) {
    //Create
    const createUserQuery = `
    INSERT INTO
    user (username,name,password,gender,location)
    VALUES
    (
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
    );`;
    await db.run(createUserQuery);
    response.send("User Created Successfully");
  } else {
    //User Already Exits
    response.status(400);
    response.send("User Already Exists");
  }
});

//login API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
   SELECT *
   FROM user
   WHERE 
   username='${username}'`;
  const dbUser = await db.get(selectUserQuery);
  console.log(dbUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    //Authenticate
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    console.log(isPasswordMatch);
    if (isPasswordMatch === true) {
      response.send("Login success");
    } else {
      response.status(400);
      console.log(password);
      console.log(dbUser.password);
      response.send("Invalid Password");
    }
  }
});
