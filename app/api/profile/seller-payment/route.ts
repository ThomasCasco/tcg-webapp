import type { SellerPaymentProvider } from "@/lib/domain/types";
import { requireAuthenticatedUser } from "@/lib/server/auth";
import {
  getSellerPaymentProfile,
  updateSellerPaymentProfile,
} from "@/lib/server/repository";

type SellerPaymentPayload = {
  whatsapp?: string;
  paymentProvider?: SellerPaymentProvider;
  paymentAlias?: string;
  paymentInstructions?: string;
};

const acceptedProviders: SellerPaymentProvider[] = [
  "mercado_pago",
  "bank_transfer",
  "cash",
  "other",
];

function isProvider(value: unknown): value is SellerPaymentProvider {
  return typeof value === "string" && acceptedProviders.includes(value as SellerPaymentProvider);
}

const WHATSAPP_PATTERN = /^[\d+()\-\s]{6,24}$/;

export async function GET() {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await getSellerPaymentProfile(user.id);
    return Response.json({ profile });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load seller payment profile.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const user = await requireAuthenticatedUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SellerPaymentPayload;
  try {
    payload = (await request.json()) as SellerPaymentPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isProvider(payload.paymentProvider)) {
    return Response.json(
      { error: "paymentProvider is required and must be a valid value." },
      { status: 400 },
    );
  }

  const paymentAlias = payload.paymentAlias?.trim();
  const paymentInstructions = payload.paymentInstructions?.trim();
  const whatsapp = payload.whatsapp?.trim();

  if (paymentAlias && paymentAlias.length > 120) {
    return Response.json(
      { error: "paymentAlias must be at most 120 characters." },
      { status: 400 },
    );
  }

  if (paymentInstructions && paymentInstructions.length > 280) {
    return Response.json(
      { error: "paymentInstructions must be at most 280 characters." },
      { status: 400 },
    );
  }

  if (whatsapp && !WHATSAPP_PATTERN.test(whatsapp)) {
    return Response.json(
      {
        error:
          "whatsapp format is invalid. Use digits and optional +, spaces, parentheses or dashes.",
      },
      { status: 400 },
    );
  }

  if (!paymentAlias && !paymentInstructions && !whatsapp) {
    return Response.json(
      { error: "Add at least one contact detail (alias, instructions or whatsapp)." },
      { status: 400 },
    );
  }

  try {
    const profile = await updateSellerPaymentProfile({
      userId: user.id,
      paymentProvider: payload.paymentProvider,
      paymentAlias,
      paymentInstructions,
      whatsapp,
    });

    return Response.json({ profile });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update seller payment profile.",
      },
      { status: 500 },
    );
  }
}
