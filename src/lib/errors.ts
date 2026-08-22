export type ApiErrorCode =
  | "INVENTORY_CONFLICT"
  | "TOKEN_EXPIRED"
  | "CONCURRENT_MODIFICATION"
  | "RATE_LIMITED"
  | "PERMISSION_DENIED"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface ErrorUiSpec {
  action: "retry" | "back-to-step" | "contact-restaurant" | "refetch" | "wait" | "none";
  preserveInput: boolean;
}

export const ERROR_UI_SPECS: Record<ApiErrorCode, ErrorUiSpec> = {
  INVENTORY_CONFLICT: { action: "back-to-step", preserveInput: true },
  TOKEN_EXPIRED: { action: "contact-restaurant", preserveInput: false },
  CONCURRENT_MODIFICATION: { action: "refetch", preserveInput: true },
  RATE_LIMITED: { action: "wait", preserveInput: true },
  PERMISSION_DENIED: { action: "none", preserveInput: true },
  INTERNAL_ERROR: { action: "retry", preserveInput: true },
  NETWORK_ERROR: { action: "retry", preserveInput: true },
};

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value
  );
}
