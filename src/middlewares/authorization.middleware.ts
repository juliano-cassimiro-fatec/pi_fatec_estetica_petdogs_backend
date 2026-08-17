import type { NextFunction, Response } from "express"
import type { UserRole } from "../models/auth.types.js"
import type { AuthenticatedRequest } from "./request.types.js"

export function ensureRoles(roles: UserRole[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Usuário não autorizado para esta ação" })
        }

        return next()
    }
}

export function resolveTargetIdForRole(role: UserRole, paramName = "id") {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: "Usuário não autenticado" })
        }

        req.targetId = req.user.role === role ? req.user.id : String(req.params[paramName] ?? "")
        return next()
    }
}
