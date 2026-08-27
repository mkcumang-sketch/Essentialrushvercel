// lib/error-handler.ts

export interface ErrorInfo {
  message: string;
  statusCode: number;
  details?: string;
}

export const handleError = (error: unknown): ErrorInfo => {
  // MongoDB duplicate key
  if (isMongoError(error) && error.code === 11000) {
    return {
      message: 'A record with this value already exists.',
      statusCode: 409,
      details: JSON.stringify(error.keyValue),
    };
  }

  // Mongoose validation error
  if (isValidationError(error)) {
    const messages = Object.values(error.errors)
      .map((e: any) => e.message)
      .join(', ');
    return { message: messages, statusCode: 400 };
  }

  // Standard JS Error
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred.',
      statusCode: 500,
    };
  }

  return { message: 'An unexpected error occurred.', statusCode: 500 };
};

// ─── Type guards ──────────────────────────────────────────────────────────────
function isMongoError(err: unknown): err is { code: number; keyValue?: object } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

function isValidationError(
  err: unknown
): err is { name: string; errors: Record<string, unknown> } {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as any).name === 'ValidationError'
  );
}
