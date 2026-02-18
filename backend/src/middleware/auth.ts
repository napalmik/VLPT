import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    accessLevel: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Необходима авторизация" });
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      accessLevel: string;
    };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Неверный или истёкший токен" });
  }
}




