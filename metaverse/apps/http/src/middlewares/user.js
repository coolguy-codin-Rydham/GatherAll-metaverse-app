import { JWT_PASSWORD } from "../config.js";
import jwt from "jsonwebtoken";

const userMiddleware = (req, res, next) => {
  const header = req.headers["authorization"];
  const token = header?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_PASSWORD);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    res.status(401).json({
      message: "Unauthorized",
    });
    return;
  }
};

export{
    userMiddleware
}