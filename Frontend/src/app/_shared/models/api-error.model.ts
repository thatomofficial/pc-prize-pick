/**
 * Normalised shape every API error gets mapped to before bubbling up to
 * components / services. The backend agreement (see BACKLOG F1.3) is
 * `{ code, message, fields? }`; this type extends that with the HTTP status
 * and the correlation id the request carried so logs / Sentry / toasts can
 * cross-reference the same call.
 */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  fields?: Record<string, string[]>;
  correlationId?: string;
  /** Original network error message when no JSON body was available. */
  rawMessage?: string;
}

/**
 * Default codes used when the backend doesn't supply one (e.g. transport
 * failure, 5xx without a JSON body). Keeping a small enum here lets callers
 * branch on `error.code === 'network'` without sprinkling magic strings.
 */
export const ApiErrorCode = {
  Network: 'network',
  Server: 'server',
  Unknown: 'unknown',
} as const;
