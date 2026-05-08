/**
 * Startup env-var validation.
 *
 * Two tiers of checks:
 *   - hard required: server cannot operate at all without these.
 *   - production-required: only enforced when NODE_ENV === "production".
 *
 * In production, missing values throw and crash the server boot — preferable
 * to discovering a broken webhook hours later because MP_WEBHOOK_SECRET was
 * silently empty. In development we log warnings instead so local work keeps
 * flowing.
 */

import { log } from "@/lib/server/logger";

type Group = {
  /** Logical area this group covers, used in error messages. */
  area: string;
  /** Always-required vars. */
  required: string[];
  /** Production-only required vars. */
  productionOnly?: string[];
  /** Custom assertions that produce error strings when they fail. */
  custom?: Array<() => string | null>;
};

const groups: Group[] = [
  {
    area: "Mercado Pago",
    required: ["MP_APP_ID", "MP_CLIENT_SECRET", "MP_ACCESS_TOKEN"],
    productionOnly: ["MP_WEBHOOK_SECRET", "APP_URL"],
    custom: [
      () => {
        const url = process.env.APP_URL?.trim();
        if (!url) return null; // covered by productionOnly check
        if (!/^https?:\/\//.test(url)) {
          return `APP_URL must include scheme (got "${url}").`;
        }
        if (process.env.NODE_ENV === "production" && !/^https:\/\//.test(url)) {
          return `APP_URL must use https in production (got "${url}").`;
        }
        return null;
      },
      () => {
        // The app accepts MERCADO_PAGO_ACCESS_TOKEN as a fallback, but warn so
        // the operator migrates to the canonical name.
        if (
          !process.env.MP_ACCESS_TOKEN?.trim() &&
          process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim()
        ) {
          return "Using deprecated MERCADO_PAGO_ACCESS_TOKEN. Rename to MP_ACCESS_TOKEN.";
        }
        return null;
      },
    ],
  },
  {
    area: "Supabase",
    required: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
  },
];

export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === "production";
  const errors: string[] = [];

  for (const group of groups) {
    for (const name of group.required) {
      if (!process.env[name]?.trim()) {
        errors.push(`[${group.area}] missing ${name}`);
      }
    }
    if (isProd && group.productionOnly) {
      for (const name of group.productionOnly) {
        if (!process.env[name]?.trim()) {
          errors.push(`[${group.area}] missing ${name} (required in production)`);
        }
      }
    }
    if (group.custom) {
      for (const check of group.custom) {
        const err = check();
        if (err) errors.push(`[${group.area}] ${err}`);
      }
    }
  }

  if (errors.length === 0) {
    log.info("env-validate: all required environment variables present");
    return;
  }

  if (isProd) {
    const message = `Environment validation failed:\n  - ${errors.join("\n  - ")}`;
    // Log AND throw — Next will surface this in the boot logs.
    log.error("env-validate: production boot blocked", { errors });
    throw new Error(message);
  }

  log.warn("env-validate: missing or invalid env vars (non-production, continuing)", {
    errors,
  });
}
