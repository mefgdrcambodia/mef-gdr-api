// const express = require("express");
// const connectDB = require("./src/util/db");
// const rateLimit = require("express-rate-limit");
// const helmet = require("helmet");
// const cors = require("cors");
// const app = express();
// const jwt = require("jsonwebtoken");
// const PORT = process.env.api_port || 8085;
// const { api_auth } = require("./src/util/api_auth");
// const { jwt_auth } = require("./src/util/jwt_auth");
// const request_user = require("./src/util/request_user");
// const https = require("https");
// const mongoose = require("mongoose");
// // app.use(
// //   rateLimit({
// //     windowMs: 15 * 60 * 1000,
// //     max: 100,
// //     message: "Too many requests",
// //   })
// // );
// app.use(cors());
// app.use(express.json());
// app.use(helmet());
// app.use(express.json({ limit: "1kb" }));
// // app.use(
// //   cors({
// //     origin: ["http://localhost:3000", "*"],
// //     methods: ["GET", "POST", "PUT", "DELETE"],
// //     credentials: true,
// //   })
// // );

// //  ================= Connection =================
// (connectDB(),
//   app.get("/", (req, res) => {
//     api_auth(req, res, () => {
//       res.send({
//         success: true,
//         message: "API Connected",
//       });
//     });
//   }));

// // Prop Object
// const prop = {
//   add_update_api: "mef/hidden/create/x8923/",
//   app: app,
//   jwt: jwt,
//   api_auth: api_auth,
//   jwt_auth: jwt_auth,
//   request_user: request_user,
// };

// const adminAPI_V1 = require("./src/v1/admin/index.route");
// adminAPI_V1(prop);

// app.listen(PORT, () => {
//   console.log(`Server is running on ${8085}`);
// });
// // 🧼 Gracefully handle shutdown
// process.on("SIGINT", async () => {
//   await mongoose.connection.close();
//   console.log("🛑 MongoDB disconnected cleanly");
//   process.exit(0);
// });

const express = require("express");
const connectDB = require("./src/util/db");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { api_auth } = require("./src/util/api_auth");
const { jwt_auth } = require("./src/util/jwt_auth");
const request_user = require("./src/util/request_user");

const app = express();
const PORT = process.env.api_port || 8085;

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

// Ignore favicon requests in logs
app.use((req, res, next) => {
  if (req.url === "/favicon.ico") {
    res.status(204).end();
    return;
  }
  next();
});

//Connect to database
connectDB();

// Setup prop object
const prop = {
  add_update_api: "mef/hidden/create/x8923",
  app: app,
  jwt: jwt,
  api_auth: api_auth,
  jwt_auth: jwt_auth,
  request_user: request_user,
};

// Register routes - only once!
const adminAPI_V1 = require("./src/v1/admin/index.route");
adminAPI_V1(prop);

// Simple test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Connected",
    timestamp: new Date().toISOString(),
  });
});

// For local development only
if (process.env.NODE_ENV !== "production") {
  const devPORT = process.env.PORT || 8085;
  app.listen(devPORT, () => {
    console.log(`Server running on http://localhost:${devPORT}`);
  });
}

// Export for Vercel (required)
module.exports = app;
