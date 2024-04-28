//create an express web Server using express and listen on port 3000
const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();
app.use("/public", express.static("public"));
const corsOptions = {
  origin: "*", // Specify the allowed origin (replace with your frontend's URL)
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Enable credentials (cookies, authorization headers, etc.)
  optionsSuccessStatus: 204, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Use cors middleware with options
app.use(cors(corsOptions));

//set storage engine
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
//init upload
const upload = multer({
  storage: storage,
});

app.use(express.static(__dirname + "/public"));
app.use("/uploads", express.static("uploads"));

app.use(bodyParser.json());
//create connection to database
const db = mysql.createConnection({
  host: "localhost",
  user: "test",
  password: "root",
  database: "swiftcart",
  insecureAuth: true,
  port: 3306,
});
db.connect((err) => {
  console.log("Connected!");
  if (err) throw err;
  console.log("Connected!");
});
const port = 3000;

//get product by id
app.get("/getProduct/:id", (req, res) => {
  db.query(
    "SELECT * FROM products WHERE ProductID = ?",
    [req.params.id],
    (err, result, fields) => {
      if (err) throw err;
      res.json(result);
    }
  );
});
app.get("/getProducts", async (req, res) => {
  try {
    let query = "SELECT * FROM products";

    // Check for search query
    const searchQuery = req.query.search;
    if (searchQuery) {
      query += ` WHERE Name LIKE '%${searchQuery}%'`;
    }

    // Check for sort query
    const sortQuery = req.query.sort;
    if (sortQuery) {
      switch (sortQuery) {
        case "price":
          query += " ORDER BY Price ASC";
          break;
        case "category":
          query += " ORDER BY Category ASC";
          break;
        // Add more cases for additional sorting options
        default:
          break;
      }
    }

    const result = await new Promise((resolve, reject) => {
      db.query(query, (err, result, fields) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// Add a new endpoint to handle adding the product to the cart
app.post("/addToCart", (req, res) => {
  const { productDetails, userId } = req.body;

  // Assuming you have a Cart table with columns: UserID, ProductID, Size, Quantity, Category, ProductAdd
  db.query(
    "INSERT INTO Cart ( ProductID, Size, Quantity, productName, Price) VALUES ( ?, ?, ?, ?, ?)",
    [
      productDetails.productId,
      productDetails.size,
      productDetails.quantity,
      productDetails.name,
      productDetails.price,
    ],
    (err, result, fields) => {
      if (err) {
        console.error("Error adding product to the cart:", err);
        res.status(500).json({ error: "Failed to add the product to the cart." });
      } else {
        res.json({ message: "Product added to the cart successfully!" });
      }
    }
  );
});

app.get("/getCart", (req, res) => {
  db.query("SELECT * FROM Cart", (err, result, fields) => {
    if (err) throw err;
    res.json(result);
  });
});

//delete product from cart
app.delete("/removeFromCart/:productId", (req, res) => {
  const productId = req.params.productId;

  // Assuming you have a Cart table with columns: UserID, ProductID, Size, Quantity, Category, ProductAdd
  db.query("DELETE FROM Cart WHERE ProductID = ?", [productId], (err, result, fields) => {
    if (err) {
      console.error("Error removing product from the cart:", err);
      res.status(500).json({ error: "Failed to remove the product from the cart." });
    } else {
      res.json({ message: "Product removed from the cart successfully!" });
    }
  });
});
// app.delete("/deleteProduct/:id", (req, res) => {
//   db.query(
//     "DELETE FROM Cart WHERE ProductID = ?",
//     [req.params.id],
//     (err, result, fields) => {
//       if (err) throw err;
//       res.json(result);
//     }
//   );
// });
//Submit order

app.post("/submitOrder", (req, res) => {
  const orderData = req.body;

  // Extract user data from orderData
  const userData = {
    Email: orderData.email,
    Password: orderData.password,
    FirstName: orderData.firstName,
    LastName: orderData.lastName,
    Address: orderData.address,
    City: orderData.city,
    PostalCode: orderData.postalCode,
    Phone: orderData.phone,
  };

  // Determine the user's role based on the password
  const userRole = determineRole(orderData.password);

  // Determine if CVV, CardholderName, and ExpirationDate are empty
  const isCOD = !(
    orderData.cvv ||
    orderData.cardholderName ||
    orderData.expirationDate
  );

  // Insert user data into the 'users' table with the determined role
  db.query(
    "INSERT INTO users (Email, Password, FirstName, LastName, Address, City, PostalCode, Phone, Role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      userData.Email,
      userData.Password,
      userData.FirstName,
      userData.LastName,
      userData.Address,
      userData.City,
      userData.PostalCode,
      userData.Phone,
      userRole,
    ],
    (userErr, userResult) => {
      if (userErr) {
        console.error("Error inserting user data:", userErr);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      console.log("User registered successfully!");

      // Extract user ID from the inserted user data
      const userID = userResult.insertId;

      if (!isCOD) {
        // Extract payment data from orderData if not COD
        const paymentData = {
          UserID: userID,
          CardNumber: orderData.cardNumber,
          CVV: orderData.cvv,
          CardholderName: orderData.cardholderName,
          ExpirationDate: orderData.expirationDate,
          COD: false,
        };

        // Insert payment data into the 'userpayments' table
        db.query(
          "INSERT INTO userpayments SET ?",
          paymentData,
          (paymentErr, paymentResult) => {
            if (paymentErr) {
              console.error("Error inserting payment data:", paymentErr);
              return res.status(500).json({ error: "Internal Server Error" });
            }
            console.log("Order submitted successfully!");
            res.status(200).json({ success: true });
          }
        );
      } else {
        // Insert order data without payment information for COD
        console.log("Order submitted successfully (COD)!");
        res.status(200).json({ success: true });
      }
    }
  );
});
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// In-memory storage for password reset tokens (replace this with a database in production)
const passwordResetTokens = {};

// Use environment variables for sensitive information
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Example: Set token expiration to 1 hour (3600000 milliseconds)
const tokenExpiration = 3600000;

app.post('/forgot-password', (req, res) => {
  const email = req.body.email;

  // Generate a unique token
  const token = crypto.randomBytes(20).toString('hex');
  passwordResetTokens[email] = {
    token: token,
    expires: Date.now() + tokenExpiration
  };

  // Nodemailer configuration
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset for Your Account',
    html: `<p>Hello,</p>
           <p>You have requested to reset your password. Click the following link to reset it:</p>
           <a href="https://localhost:${port}/reset-password/${token}">Reset Password</a>
           <p>If you did not request this, please ignore this email.</p>`
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error sending email');
    } else {
      console.log('Email sent: ' + info.response);
      res.status(200).send('Password reset instructions sent to your email.');
    }
  });
});

app.get('/reset-password/:token', (req, res) => {
  const token = req.params.token;
  const resetToken = passwordResetTokens[token];

  // Check if the token exists and has not expired
  if (resetToken && resetToken.expires > Date.now()) {
    // Render a password reset form or redirect to a page where the user can set a new password
    res.send('Password reset form goes here.');
  } else {
    // Token is invalid or expired
    res.status(400).send('Invalid or expired token.');
  }
});
function determineRole(password) {
  // Check if the password includes "admin"
  const isAdmin = password.toLowerCase().includes("admin");
  return isAdmin ? "admin" : "customer";
}

function determineRole(password) {
  // Check if the password includes "admin"
  const isAdmin = password.toLowerCase().includes("admin");
  return isAdmin ? "admin" : "customer";
}

function determineRole(password) {
  // Check if the password includes "admin"
  const isAdmin = password.toLowerCase().includes("admin");

  return isAdmin ? "admin" : "customer";
}
// Set Up Session Middleware in Your Express App:
const session = require("express-session");
app.use(
  session({
    secret: "123", // Change this to a secure, random key
    resave: false,
    saveUninitialized: true,
  })
);

// Login user
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Replace with your database query to check email and password
  db.query(
    "SELECT * FROM users WHERE Email = ? AND Password = ?",
    [email, password],
    (err, results) => {
      if (err) {
        console.error("Error during login query:", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set the session userId after successful login
      req.session.userId = results[0].UserID; // Assuming UserID is the correct field
      res.json({ success: true, message: "Login successful" });
      // Replace with your authentication logic (generate and return a token, etc.)
      // For simplicity, we're returning a success message here.
    }
  );
});
// logout user
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json({ success: true });
    }
  });
});

// protected route
app.get("/some-protected-route", (req, res) => {
  if (!req.session.userId) {
    // User is not authenticated, redirect or send an error response
    res.status(401).json({ error: "Unauthorized" });
  } else {
    // User is authenticated, proceed with the route logic
    res.json({ success: true, message: "You are logged in!" });
  }
});
  //Contact Us Form

 app.post("/submitContactForm", (req, res) => {
    const { name, email, message } = req.body;

    // Insert the contact form data into the 'contact_forms' table
    const sql = "INSERT INTO contactmessages (Name, Email, Message) VALUES (?, ?, ?)";
    const values = [name, email, message];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error inserting contact form data:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        console.log("Contact form data inserted successfully");
        res.json({ success: true, message: "Contact form submitted successfully!" });
    });
});
//admin dashboard
app.get("/get/:table", (req, res) => {
  const table = req.params.table;

  db.query(`SELECT * FROM ${table}`, (err, result, fields) => {
    if (err) throw err;
    res.json(result);
  });
});


  app.delete("/delete/:table/:id", (req, res) => {
    const table = req.params.table;
    const id = req.params.id;

    db.query(`DELETE FROM ${table} WHERE ProductID = ?`, [id], (err, result, fields) => {
      if (err) throw err;
      res.json(result);
    });
  });
  
  app.put("/update/:table/:id", (req, res) => {
    const table = req.params.table;
    const id = req.params.id;
    const updateData = req.body;
  
    // Assuming 'ProductID' is the primary key column
    db.query(`UPDATE ${table} SET ? WHERE ProductID = ?`, [updateData, id], (err, result, fields) => {
      if (err) {
        console.error("Error updating data:", err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.json({ success: true, message: "Data updated successfully!" });
      }
    });
  });
    
//add product with an image
app.post("/addProduct", upload.array("files"), (req, res) => {
  //open database connection and retrieve data from product table
  var files = req.files;
  let fileNames = [];
  for (let i = 0; i < files.length; i++) {
    fileNames.push(files[i].path);
  }


  db.query(
    "INSERT INTO products (Name, Category, Description, Price, Size, Quantity, ImagePath) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      req.body.Name,
      req.body.Category,
      req.body.Description,
      req.body.Price,
      req.body.Size,
      req.body.Quantity,
      JSON.stringify(fileNames),
    ],
    (err, result, fields) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
