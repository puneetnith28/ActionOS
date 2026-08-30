export function statusPage(input: { requestCount: number; startedAt: string }): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>ActionOS Merchant Sandbox</title><style>body{font:16px system-ui;max-width:760px;margin:4rem auto;padding:0 1rem;color:#16211b}strong{color:#9a3412}.card{padding:1.5rem;border:1px solid #d7ddd9;border-radius:16px;background:#f8faf9}code{background:#e9eeeb;padding:.15rem .35rem;border-radius:4px}</style></head>
<body><main><p><strong>CONTROLLED DEMO SERVICE — NOT A REAL MERCHANT</strong></p><h1>Merchant Sandbox</h1><div class="card"><p>This separately running service exercises real HTTP boundaries, idempotency, failures, signed callbacks, and replay handling.</p><p>Requests recorded: <code>${String(input.requestCount)}</code></p><p>Started: <code>${input.startedAt}</code></p></div></main></body></html>`;
}
