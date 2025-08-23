// backend/src/controllers/upload.controller.ts
import { Request, Response } from "express";
import { upload } from "../middlewares/upload"; // ✅ coincide con tu archivo


export const uploadImage = [
  upload.single("image"), // el campo viene de frontend como 'image'
  (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const url = `/uploads/obras/${req.file.filename}`; // ruta relativa para frontend
    res.json({ url });
  },
];
