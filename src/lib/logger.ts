import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { app: "contact-portal" },
  redact: {
    paths: [
      "password",
      "passwordHash",
      "accessToken",
      "smtpPass",
      "email",
      "phone",
      "*.password",
      "*.passwordHash",
      "*.accessToken",
      "*.smtpPass",
      "*.email",
      "*.phone",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[redacted]",
  },
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
      : undefined,
});
