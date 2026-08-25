import type { RequestHandler } from "express"

export function rateLimit(maxRequests: number, windowMs: number): RequestHandler {
    const clients = new Map<string, { count: number; resetAt: number }>()
    return (req, res, next) => {
        const now = Date.now()
        const key = req.ip ?? req.socket.remoteAddress ?? "unknown"
        const current = clients.get(key)
        if (!current || current.resetAt <= now) {
            clients.set(key, { count: 1, resetAt: now + windowMs })
            next(); return
        }
        current.count += 1
        if (current.count > maxRequests) {
            res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000))
            res.status(429).json({ message: "Muitas tentativas. Tente novamente mais tarde", code: "RATE_LIMITED" })
            return
        }
        next()
    }
}
