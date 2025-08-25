import { NextRequest, NextResponse } from 'next/server'
import { ErrorHandler, ApiError } from './error-handler'

// Simple in-memory rate limiter per IP+route+method
// Note: Suitable for dev/small deployments. For production, consider Redis/Upstash.
const buckets = new Map<string, { count: number; resetAt: number }>()

export type Handler = (req: NextRequest, context?: any) => Promise<NextResponse> | NextResponse

export interface RateLimitOptions {
  points?: number // max requests in window
  duration?: number // seconds
}

export interface MiddlewareOptions {
  rateLimit?: RateLimitOptions
  log?: boolean
  cors?: {
    origin?: string | string[]
    methods?: string[]
    headers?: string[]
  }
  validateContentType?: string[]
}

function getClientIp(req: NextRequest) {
  const xfwd = req.headers.get('x-forwarded-for')
  if (xfwd) return xfwd.split(',')[0].trim()
  // NextRequest.ip may be undefined in Node runtime; fall back to remote address header
  return (req as any).ip || req.headers.get('x-real-ip') || '127.0.0.1'
}

export function withLogging(handler: Handler): Handler {
  return async (req: NextRequest, context?: any) => {
    const start = Date.now()
    const ip = getClientIp(req)
    const id = `${req.method} ${new URL(req.url).pathname}`

    try {
      const res = await handler(req, context)
      const ms = Date.now() - start
      if (process.env.NODE_ENV !== 'production') {
        // Keep logs quieter in prod by default
        console.log(`[api] ${id} ${res.status} - ${ms}ms - ip=${ip}`)
      }
      return res
    } catch (err) {
      const ms = Date.now() - start
      console.error(`[api] ${id} 500 - ${ms}ms - ip=${ip} - error=`, err)
      
      // Use the centralized error handler
      const errorResponse = ErrorHandler.createErrorResponse(err)
      return NextResponse.json(
        { success: errorResponse.success, error: errorResponse.error },
        { status: errorResponse.statusCode }
      )
    }
  }
}

export function withRateLimit(handler: Handler, opts: RateLimitOptions = {}): Handler {
  const points = Math.max(1, opts.points ?? 30)
  const duration = Math.max(1, opts.duration ?? 60) // seconds

  return async (req: NextRequest, context?: any) => {
    const ip = getClientIp(req)
    const pathname = new URL(req.url).pathname
    const bucketKey = `${ip}:${pathname}:${req.method}`

    const now = Date.now()
    const windowMs = duration * 1000
    const entry = buckets.get(bucketKey)

    if (!entry || now > entry.resetAt) {
      buckets.set(bucketKey, { count: 1, resetAt: now + windowMs })
    } else {
      if (entry.count >= points) {
        const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000)
        return NextResponse.json(
          { success: false, error: 'Too many requests' },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfterSec),
            },
          }
        )
      }
      entry.count += 1
    }

    return handler(req, context)
  }
}

export function withMiddlewares(handler: Handler, opts: MiddlewareOptions = {}): Handler {
  let wrapped = handler
  if (opts.rateLimit) wrapped = withRateLimit(wrapped, opts.rateLimit)
  wrapped = withLogging(wrapped)
  return wrapped
}

