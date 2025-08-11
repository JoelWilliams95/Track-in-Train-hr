import { z } from 'zod'

const EnvSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_MAP_PROVIDER: z.enum(['leaflet', 'google']).default('leaflet'),
})

type Env = z.infer<typeof EnvSchema>

let cached: Env | null = null

export function getEnv(): Env {
  if (cached) return cached

  const parsed = EnvSchema.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_MAP_PROVIDER: process.env.NEXT_PUBLIC_MAP_PROVIDER,
  })

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Invalid environment variables: ${issues}`)
  }

  cached = parsed.data
  return cached
}

