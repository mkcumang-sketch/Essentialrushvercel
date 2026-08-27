import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";

import { requireSuperAdmin } from "@/lib/auth";

import { AbandonedCart } from "@/models/AbandonedCart";

import {
  validateAndFormatPhone,
  getWhatsAppUrl,
} from "@/lib/phone";


// ======================================================
// NEXT.JS CONFIG
// ======================================================

export const dynamic = "force-dynamic";

export const revalidate = 0;

export const fetchCache = "force-no-store";


// ======================================================
// LOCAL CONSTANTS
// ======================================================

const CART_CONFIG = {
  DEFAULT_NAME: "Vault Client",
} as const;


const URLS = {
  CART_RECOVERY: "/cart",
  DEFAULT_APP_URL:
    "https://essential-ivory.vercel.app",
} as const;


const ERROR_MESSAGES = {
  UNAUTHORIZED:
    "You do not have access to do that.",

  MISSING_LEAD_ID:
    "Missing or invalid leadId",

  LEAD_NOT_FOUND:
    "Lead not found",

  INVALID_PHONE:
    "Lead has no valid phone number",

  INTERNAL_ERROR:
    "An unexpected error occurred",
} as const;


const HTTP_STATUS = {
  OK: 200,

  BAD_REQUEST: 400,

  FORBIDDEN: 403,

  NOT_FOUND: 404,

  INTERNAL_ERROR: 500,
} as const;


// ======================================================
// TYPES
// ======================================================

interface PostRequestBody {
  leadId?: string;
}


interface SuccessResponse {
  success: true;

  url: string;

  message?: string;
}


interface ErrorResponse {
  success: false;

  error: string;

  code?: string;
}


// ======================================================
// VALIDATE REQUEST
// ======================================================

function validateRequest(
  body: unknown
): {
  isValid: boolean;

  leadId?: string;

  error?: string;
} {

  // Check body
  if (
    !body ||
    typeof body !== "object"
  ) {
    return {
      isValid: false,

      error:
        ERROR_MESSAGES.MISSING_LEAD_ID,
    };
  }


  const { leadId } =
    body as PostRequestBody;


  // Validate leadId
  if (
    !leadId ||
    typeof leadId !== "string" ||
    leadId.trim().length === 0
  ) {
    return {
      isValid: false,

      error:
        ERROR_MESSAGES.MISSING_LEAD_ID,
    };
  }


  return {
    isValid: true,

    leadId:
      leadId.trim(),
  };
}


// ======================================================
// POST
// /api/whatsapp/send-cart-recovery
// ======================================================

export async function POST(
  req: NextRequest
): Promise<
  NextResponse<
    SuccessResponse |
    ErrorResponse
  >
> {

  try {

    // ==================================================
    // 1. ADMIN AUTHENTICATION
    // ==================================================

    const isAuthorized =
      await requireSuperAdmin();


    if (!isAuthorized) {

      return NextResponse.json(
        {
          success: false,

          error:
            ERROR_MESSAGES.UNAUTHORIZED,
        },

        {
          status:
            HTTP_STATUS.FORBIDDEN,
        }
      );
    }


    // ==================================================
    // 2. PARSE REQUEST BODY
    // ==================================================

    let body: unknown;


    try {

      body =
        await req.json();

    } catch {

      return NextResponse.json(
        {
          success: false,

          error:
            "Invalid JSON in request body",
        },

        {
          status:
            HTTP_STATUS.BAD_REQUEST,
        }
      );
    }


    // ==================================================
    // 3. VALIDATE BODY
    // ==================================================

    const validation =
      validateRequest(body);


    if (!validation.isValid) {

      return NextResponse.json(
        {
          success: false,

          error:
            validation.error ||
            ERROR_MESSAGES.MISSING_LEAD_ID,
        },

        {
          status:
            HTTP_STATUS.BAD_REQUEST,
        }
      );
    }


    const leadId =
      validation.leadId!;


    // ==================================================
    // 4. CONNECT DATABASE
    // ==================================================

    await connectDB();


    // ==================================================
    // 5. FIND ABANDONED CART
    // ==================================================

    const lead =
      await AbandonedCart
        .findById(leadId)
        .lean()
        .exec();


    if (!lead) {

      return NextResponse.json(
        {
          success: false,

          error:
            ERROR_MESSAGES.LEAD_NOT_FOUND,
        },

        {
          status:
            HTTP_STATUS.NOT_FOUND,
        }
      );
    }


    // ==================================================
    // 6. VALIDATE PHONE
    // ==================================================

    if (
      !lead.phone ||
      typeof lead.phone !== "string"
    ) {

      return NextResponse.json(
        {
          success: false,

          error:
            ERROR_MESSAGES.INVALID_PHONE,
        },

        {
          status:
            HTTP_STATUS.BAD_REQUEST,
        }
      );
    }


    const phoneValidation =
      validateAndFormatPhone(
        lead.phone
      );


    if (
      !phoneValidation ||
      !phoneValidation.isValid
    ) {

      return NextResponse.json(
        {
          success: false,

          error:
            phoneValidation?.error ||
            ERROR_MESSAGES.INVALID_PHONE,
        },

        {
          status:
            HTTP_STATUS.BAD_REQUEST,
        }
      );
    }


    // ==================================================
    // 7. APP URL
    // ==================================================

    const appUrl =
      process.env.NEXTAUTH_URL ||
      URLS.DEFAULT_APP_URL;


    // ==================================================
    // 8. CART RECOVERY LINK
    // ==================================================

    const recoveryLink =
      `${appUrl}${URLS.CART_RECOVERY}`;


    // ==================================================
    // 9. CLIENT NAME
    // ==================================================

    const clientName =
      typeof lead.name === "string" &&
      lead.name.trim().length > 0
        ? lead.name.trim()
        : CART_CONFIG.DEFAULT_NAME;


    // ==================================================
    // 10. WHATSAPP MESSAGE
    // ==================================================

    const message =
      `Dear ${clientName}, your curated selection has been safely secured in our private vault. Tap here to complete your exclusive acquisition: ${recoveryLink}`;


    // ==================================================
    // 11. WHATSAPP URL
    // ==================================================

    const whatsappUrl =
      getWhatsAppUrl(
        phoneValidation.formattedNumber,
        message
      );


    // ==================================================
    // 12. LOG
    // ==================================================

    console.log(
      `WhatsApp recovery link generated for lead: ${leadId}`
    );


    // ==================================================
    // 13. SUCCESS RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        success: true,

        url:
          whatsappUrl,

        message:
          "WhatsApp link generated successfully",
      },

      {
        status:
          HTTP_STATUS.OK,
      }
    );

  } catch (error) {

    console.error(
      "Cart Recovery API Error:",
      error
    );


    const errorMessage =
      error instanceof Error
        ? error.message
        : ERROR_MESSAGES.INTERNAL_ERROR;


    return NextResponse.json(
      {
        success: false,

        error:
          errorMessage,
      },

      {
        status:
          HTTP_STATUS.INTERNAL_ERROR,
      }
    );
  }
}


// ======================================================
// GET - METHOD NOT ALLOWED
// ======================================================

export async function GET() {

  return NextResponse.json(
    {
      success: false,

      error:
        "Method not allowed",
    },

    {
      status: 405,
    }
  );
}