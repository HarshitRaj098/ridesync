import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'
import { config, jwtSecret } from './config'

export interface AuthedRequest extends Request {
  userId?: string
  userName?: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions)
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, jwtSecret) as { sub: string }
  } catch {
    return null
  }
}

/** Express middleware — requires `Authorization: Bearer <jwt>`. */
export function authRequired(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const payload = token ? verifyToken(token) : null
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized — a valid JWT is required' })
    return
  }
  req.userId = payload.sub
  next()
}

export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const payload = token ? verifyToken(token) : null
  if (payload) req.userId = payload.sub
  next()
}
