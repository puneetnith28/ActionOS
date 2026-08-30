const messages: Readonly<Record<string, string>> = {
  AUTHENTICATION_REQUIRED: "We could not start your private session. Please try again.",
  CASE_OWNERSHIP_REQUIRED: "Your private session is still loading. Please retry this page.",
  DAILY_CASE_BUDGET_EXHAUSTED: "This demo has reached today's case limit for this session.",
  MODEL_CALL_BUDGET_EXHAUSTED: "This case reached its model-call limit. Start a new case or try tomorrow.",
  EMPTY_FILE: "That file is empty. Choose another screenshot, photo, or PDF.",
  FILE_TOO_LARGE: "That file is larger than 10 MB. Choose a smaller file.",
  UNSUPPORTED_MEDIA_TYPE: "Use a PDF, JPEG, or PNG file.",
  MEDIA_TYPE_MISMATCH: "The file contents do not match its format. Export it again as PDF, JPEG, or PNG.",
  PDF_PAGE_LIMIT: "That PDF has more than 20 pages. Upload only the pages containing the promise.",
  IMAGE_PIXEL_LIMIT: "That image is too large to analyze safely. Resize it and try again.",
  MALFORMED_FILE: "DueBack could not read that file. Export it again or upload a screenshot.",
  PROMISE_SOURCE_REQUIRED: "Paste a promise or choose a file to continue.",
  PROMISE_PLAN_INVALID: "DueBack read the promise but could not build a safe plan. Add the company, reference, expected result, and due date, then try again.",
  CRITICAL_FIELDS_UNRESOLVED: "Confirm every highlighted field before activation.",
  RECOVERABLE_IDENTITY_REQUIRED: "Save recoverable access before activating a real email follow-up.",
  VERIFIED_NOTIFICATION_EMAIL_REQUIRED: "Case updates must use the verified email on your Google identity.",
  PLAN_REQUEST_FAILED: "We could not load this plan. Please retry.",
  REQUEST_FAILED: "DueBack could not complete that request. Please try again."
};

export function errorCopy(code: string): string {
  return messages[code] ?? "DueBack could not complete that request. Please try again.";
}
