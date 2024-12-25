import { JWT_PASSWORD } from "../config.js";
import jwt from "jsonwebtoken";

export const adminMiddleware = (req, res, next) => {
  console.log("Admin middleware triggered");

  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header missing or malformed" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    // console.log("1, 2, 3")
    const decoded = jwt.verify(token, JWT_PASSWORD);
    // console.log("1, 3, 4")
    
    if (decoded.role !== "Admin") {
      // console.log("Role: ", decoded.role)
      // console.log("1, 4, 5, 6")
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    // console.log("1, 4, 5")
    
    // console.log("Decoded token:", decoded);
    req.userId = decoded.userId; 
    // console.log("1, 5, 6")

    next(); 
  } catch (e) {
    console.error("JWT verification error:", e.message);

    const message = e.name === "TokenExpiredError" 
      ? "Token expired"
      : "Invalid token";
      
    return res.status(401).json({ message });
  }
};
