const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

app.use(express.json());

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
});
const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const coursechema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageLink: String,
  published: Boolean,
});

const User = mongoose.model("User", userSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Course = mongoose.model("Course", coursechema);

const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: "1h" });

const adminAuth = (req, res, next) => {
  let headers = req.headers;
  const authHeader = headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.TOKEN_SECRET, (err, admin) => {
    if (err) return res.sendStatus(403);
    req.user = admin;
    next();
  });
};

const userAuth = (req, res, next) => {
  let headers = req.headers;
  const authHeader = headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.TOKEN_SECRET, async (err, payload) => {
    if (err) return res.sendStatus(403);
    let userExists = await User.findOne({ username: payload.username });

    if (userExists) {
      req.user = userExists;
      next();
    } else {
      res.status(403).json({ message: "Invalid credentials" });
    }
  });
};

mongoose.connect(String(process.env.DB_URL) + "courses", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Admin routes
app.post("/admin/signup", async (req, res) => {
  // logic to sign up admin
  let data = req.body;

  let adminExists = await Admin.findOne({ username: data.username });

  if (adminExists) {
    return res.status(400).json({ message: "Admin already exists" });
  } else {
    const token = generateAccessToken({ username: data.username });
    const newAdmin = new Admin(data);
    await newAdmin.save();

    return res
      .status(200)
      .json({ message: "Admin created successfully", token: token });
  }
});

app.post("/admin/login", async (req, res) => {
  // logic to log in admin
  let headers = req.headers;

  const adminExists = await Admin.findOne({
    username: headers.username,
    password: headers.password,
  });

  if (adminExists) {
    const token = generateAccessToken({ username: headers.username });
    return res
      .status(200)
      .json({ message: "Admin logged in successfully", token: token });
  } else {
    res.status(403).json({ message: "Invalid credentials" });
  }
});

app.post("/admin/courses", adminAuth, async (req, res) => {
  // logic to create a course
  let data = req.body;
  let courseExists = await Course.findOne({ title: data.title });
  if (courseExists) {
    res.status(400).json({ message: "Course already exists" });
  } else {
    const course = new Course(data);
    await course.save();
    res
      .status(200)
      .json({ message: "Course created successfully", courseId: course.id });
  }
});

app.put("/admin/courses/:courseId", adminAuth, async (req, res) => {
  // logic to edit a course
  let data = req.body;
  let course = await Course.findByIdAndUpdate(req.params.courseId, data, {
    new: true,
  });
  if (course) {
    res.status(200).json({ message: "Course updated successfully" });
  } else {
    res.status(400).json({ message: "Course does not exist" });
  }
});

app.get("/admin/courses", adminAuth, async (req, res) => {
  // logic to get all courses

  const courses = await Course.find({});
  res.status(200).json({ courses: courses });
});

// User routes
app.post("/users/signup", async (req, res) => {
  // logic to sign up user
  let data = req.body;

  let userExists = await User.findOne({ username: data.username });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  } else {
    const newUser = new User(data);
    await newUser.save();
    const token = generateAccessToken({ username: data.username });
    return res
      .status(200)
      .json({ message: "User created successfully", token: token });
  }
});

app.post("/users/login", async (req, res) => {
  // logic to log in user
  let headers = req.headers;
  let userExists = await User.findOne({
    username: headers.username,
    password: headers.password,
  });

  if (userExists) {
    const token = generateAccessToken({ username: headers.username });
    return res
      .status(200)
      .json({ message: "User logged in successfully", token: token });
  } else {
    return res.status(403).json({ message: "Invalid credentials" });
  }
});

app.get("/users/courses", userAuth, async (req, res) => {
  // logic to list all courses
  let courses = await Course.find({ published: true });
  res.status(200).json({ courses: courses });
});

app.post("/users/courses/:courseId", userAuth, async (req, res) => {
  // logic to purchase a course
  let courseId = req.params.courseId;
  let user = req.user;

  let courseExists = await Course.findById(courseId);
  if (courseExists) {
    user.purchasedCourses.push(courseExists);
    await user.save();
    res.status(200).json({ message: "Course purchased successfully" });
  } else {
    res.status(400).json({ message: "Course does not exist" });
  }
});

app.get("/users/purchasedCourses", userAuth, async (req, res) => {
  // logic to view purchased courses

  const user = req.user;
  let coursesPurchased = await user.populate("purchasedCourses");

  res.status(200).json({ purchasedCourses: coursesPurchased || [] });
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
