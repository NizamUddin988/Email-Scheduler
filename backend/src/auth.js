import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { User } from "./models.js";

export function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub).select("_id name email");

    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
