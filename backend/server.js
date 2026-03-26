const path = require("path");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

dotenv.config();

const passport = require("./src/config/passport");

const authRoutes = require("./src/routes/authRoutes");
const sectionRoutes = require("./src/routes/sectionRoutes");
const billRoutes = require("./src/routes/billRoutes");

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true); // ❌ Problem: allows ANY origin
    },
    credentials: true, // ✓ Correct: allows credentials (cookies)
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    //Start the backend server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

app.get("/", (req, res) => {
  res.json({ message: "Rural Ledger API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/bills", billRoutes);
