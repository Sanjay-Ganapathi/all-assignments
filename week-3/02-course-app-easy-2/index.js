const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

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

  jwt.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
    if (err) return res.sendStatus(403);
    let userExists = USERS.find((u) => {
      return u.username === payload.username;
    });
    console.log(payload);
    console.log(userExists);
    if (userExists) {
      req.user = userExists;
      next();
    } else {
      res.status(403).json({ message: "Invalid credentials" });
    }
  });
};

// Admin routes
app.post("/admin/signup", (req, res) => {
  // logic to sign up admin
  let data = req.body;

  let adminExists = ADMINS.find((admin) => {
    return admin.username === data.username;
  });

  if (adminExists) {
    return res.status(400).json({ message: "Admin already exists" });
  } else {
    const token = generateAccessToken({ username: data.username });
    ADMINS.push(data);
    return res
      .status(200)
      .json({ message: "Admin created successfully", token: token });
  }
});

app.post("/admin/login", (req, res) => {
  // logic to log in admin
  let headers = req.headers;

  let adminExists = ADMINS.find((admin) => {
    return (
      admin.username === headers.username && admin.password === headers.password
    );
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

app.post("/admin/courses", adminAuth, (req, res) => {
  // logic to create a course
  let data = req.body;
  let courseExists = COURSES.find((course) => course.title === data.title);
  if (courseExists) {
    res.status(400).json({ message: "Course already exists" });
  } else {
    const id =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    COURSES.push({ ...data, id });
    res
      .status(200)
      .json({ message: "Course created successfully", courseId: id });
    console.log(COURSES);
  }
});

app.put("/admin/courses/:courseId", adminAuth, (req, res) => {
  // logic to edit a course
  let data = req.body;
  let courseIndex = COURSES.findIndex(
    (course) => course.id === req.params.courseId
  );
  if (courseIndex !== -1) {
    data = { ...data, id: COURSES[courseIndex].id };
    COURSES[courseIndex] = data;
    console.log(COURSES);
    res.status(200).json({ message: "Course updated successfully" });
  } else {
    res.status(400).json({ message: "Course does not exist" });
  }
});

app.get("/admin/courses", adminAuth, (req, res) => {
  // logic to get all courses

  res.status(200).json({ courses: COURSES });
});

// User routes
app.post("/users/signup", (req, res) => {
  // logic to sign up user
  let data = req.body;

  let userExists = USERS.find((user) => {
    return user.username === data.username;
  });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  } else {
    const token = generateAccessToken({ username: data.username });
    data.coursesPurchased = [];
    USERS.push(data);
    return res
      .status(200)
      .json({ message: "User created successfully", token: token });
  }
});

app.post("/users/login", (req, res) => {
  // logic to log in user
  let headers = req.headers;
  let userExists = USERS.find((user) => {
    return (
      user.username === headers.username && user.password === headers.password
    );
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

app.get("/users/courses", userAuth, (req, res) => {
  // logic to list all courses
  let courses = COURSES.filter((course) => course.published);
  res.status(200).json({ courses: courses });
});

app.post("/users/courses/:courseId", userAuth, (req, res) => {
  // logic to purchase a course
  let courseId = req.params.courseId;

  let courseExists = COURSES.find(
    (course) => course.id === courseId && course.published
  );
  if (courseExists) {
    req.user.coursesPurchased.push(courseId);
    res.status(200).json({ message: "Course purchased successfully" });
  } else {
    res.status(400).json({ message: "Course does not exist" });
  }
});

app.get("/users/purchasedCourses", userAuth, (req, res) => {
  // logic to view purchased courses

  let coursesPurchased = req.user.coursesPurchased;
  let courses = [];
  coursesPurchased.forEach((courseId) => {
    courses.push(COURSES.find((course) => course.id === courseId));
  });

  res.status(200).json({ purchasedCourses: courses });
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
