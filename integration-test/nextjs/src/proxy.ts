import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = request.nextUrl.searchParams.get("nonce");
  if (nonce) {
    // we set a fixed nonce here so we can test correct and incorrect nonce values
    const validNonce = "8IBTHwOdqNKAWeKl7plt8g==";
    // 'unsafe-eval' for `react-refresh`
    const contentSecurityPolicyHeaderValue = `default-src 'self'; script-src 'nonce-${validNonce}' 'strict-dynamic' 'unsafe-eval';`;

    const requestHeaders = new Headers(request.headers);
    // valid nonce for next
    requestHeaders.set("x-nonce", validNonce);
    // potentially invalid nonce for `ApolloNextAppProvider`
    requestHeaders.set("x-nonce-param", nonce);
    requestHeaders.set(
      "Content-Security-Policy",
      contentSecurityPolicyHeaderValue
    );

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set(
      "Content-Security-Policy",
      contentSecurityPolicyHeaderValue
    );

    return response;
  }
}
