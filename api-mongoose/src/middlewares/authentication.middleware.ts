import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
/// <reference path="../types/custom.d.ts" />
dotenv.config();

interface JwtUserPayload {
  id?: string;
  _id?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  role?: string;
}

export const authentification = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const token = header.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET) as JwtUserPayload;
    if (!decode) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    req.currentUser = decode;
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
};