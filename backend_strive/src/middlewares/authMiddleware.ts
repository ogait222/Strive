import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface jwtPayload {
  id: string;
  role: string;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Token não fornecido" });
        }

        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET as string;
        
        const decoded = jwt.verify(token, secret) as jwtPayload;

        (req as any).user  = { id: decoded.id, role: decoded.role };

        next();
    } catch (error) {
        res.status(401).json({ message: "Token inválido", error });
    }
};

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ message: "Acesso negado" });
        }

        next();
    };
};

export default {verifyToken , authorizeRoles};

