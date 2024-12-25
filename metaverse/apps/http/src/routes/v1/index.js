import { Router } from "express";
import { userRouter } from "./user.js";
import { adminRouter } from "./admin.js";
import client from "@repo/db/client";
import { compare, hash } from "../../scrypt.js";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../../config.js";
import { spaceRouter } from "./space.js";
export const router = Router();

router.post("/signup", async (req, res) => {
  const parsedData = req.body;

  // console.log(parsedData)

  if (!parsedData || !parsedData.username || !parsedData.password) {
    res.status(400).json({ message: "Validation Failed" });
    return;
  }

  const hashedPassword = await hash(parsedData.password);

  try {
    const userData = {
      username: parsedData.username,
      password: hashedPassword,
      role: parsedData.type == "admin" ? "Admin" : "User",
    };
    // console.log("Parsed Data: ", {username: parsedData.username,
    //   password: hashedPassword,
    //   role: parsedData.role
    // })
    // console.log("User Data: ", userData);

    const user = await client.user.create({
      data: userData,
    });

    // console.log("DB Saved User Data");

    res.json({
      userId: user.id,
    });
  } catch (e) {
    console.log(e);

    res.status(400).json({
      message: "User Already Exists",
    });
  }
});

router.post("/signin", async (req, res) => {
  const parsedData = req.body;
  if (!parsedData || !parsedData.username || !parsedData.password) {
    res.status(403).json({ message: "Validation Failed" });
    return;
  }

  try {
    const user = await client.user.findUnique({
      where: {
        username: parsedData.username,
      },
    });

    // console.log(user);

    if (!user) {
      res.status(403).json({
        message: "User not found",
      });
      return;
    }

    const isValid = await compare(parsedData.password, user.password);

    if (!isValid) {
      res.status(403).json({
        message: "Invalid Password",
      });
    }

    // console.log({
    //   userId: user.id,
    //   role: user.role
    // })

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      JWT_PASSWORD
    );

    res.json({
      token,
    });
  } catch (e) {
    res.status(400).json({
      message: "Internal Server Error",
    });
  }
});

router.get("/elements", async (req, res) => {
  const elements = await client.element.findMany();

  res.json({
    elements: elements.map((e) => ({
      id: e.id,
      imageUrl: e.imageUrl,
      width: e.width,
      height: e.height,
      static: e.static,
    })),
  });
});

router.get("/avatars", async (req, res) => {
  const avatars = await client.avatar.findMany({});
  res.json({
    avatars: avatars.map((x) => ({
      id: x.id,
      imageUrl: x.imageUrl,
      name: x.name,
    })),
  });
});

router.use("/user", userRouter);
router.use("/space", spaceRouter);
router.use("/admin", adminRouter);

/**
 * Apidog dummy requests
 * signup/ signin
 * 
 * {
 *  "username":"rydham",
 *  "password":"rydham",
 *  "type":"admin"
 * }
 * 
 *  admin token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbTR6cXluZzgwMDAwaTBlbHd0ZHZ4YzE5Iiwicm9sZSI6IlVzZXIiLCJpYXQiOjE3MzQ4ODA0MjV9.Ve2tb7x9H_gBf555lu1Rjseb0fI63tAcbEwvh3RIl20  
 * 
 * {
 *  "username":"rydham-admin",
 *  "password":"rydham",
 *  "type":"admin"
 * }
 * 
 * admin token2 = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbTR6cmJnOXYwMDAwaTBzcWozZHg0eWI5Iiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNzM0ODgwOTUwfQ.B6tegQ0CCvE_5Yn9neO67e1q3b8i2SuFVy97eZdNnzc
 * 
 * {
 *  "username":"rydham-user",
 *  "password":"rydham",
 *  "type":"user"
 * }
 * 
 * user token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbTR6cjJ0NnAwMDAxaTBlbHQ2YTZ5ZmhvIiwicm9sZSI6IlVzZXIiLCJpYXQiOjE3MzQ4ODA1NDh9.WCD0mfnm0LhJNKRymlzQbx_up37QUrO-5KnzVypY2pY
 * 
 * 
 * {
 *   "name": "new space",
 *   "dimensions":"200x200"
 * }
 * 
 * spaceId = cm4zr8tvk0001i0ffqhhac7ua
 */


