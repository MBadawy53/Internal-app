import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  AUTH_TRUST_HOST: z
    .union([z.string(), z.boolean()])
    .transform((v) => v === true || v === "true")
    .default(true),
  SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(28_800),

  APP_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/u, "APP_ENCRYPTION_KEY must be 32 bytes hex (64 chars)"),

  DEFAULT_LOCALE: z.enum(["en", "ar"]).default("en"),
  SUPPORTED_LOCALES: z.string().default("en,ar"),

  TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  PUBLIC_FORM_RATE_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(5),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  EMAIL_PROVIDER: z.enum(["stub", "resend", "smtp"]).default("stub"),
  EMAIL_FROM: z.string().default("Contact Financial <noreply@contact.eg>"),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),

  SMS_PROVIDER: z.enum(["stub", "twilio"]).default("stub"),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_SMS_FROM: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),

  CRM_PROVIDER: z.string().default("stub"),
  CRM_BASE_URL: z.string().optional(),
  CRM_API_KEY: z.string().optional(),

  CORE_BANKING_PROVIDER: z.string().default("stub"),
  CORE_BANKING_BASE_URL: z.string().optional(),
  CORE_BANKING_API_KEY: z.string().optional(),

  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),

  UPLOAD_PROVIDER: z.enum(["local", "s3"]).default("local"),
  UPLOAD_LOCAL_DIR: z.string().default("./public/uploads"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:\n" +
      parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n"),
  );
  throw new Error("Invalid environment configuration. See errors above.");
}

export const env: Env = parsed.data;
