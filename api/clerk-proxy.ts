export const config = {
  runtime: "edge",
}

const CLERK_FRONTEND_API = "https://frontend-api.clerk.dev"

export default async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url)

    // Determine target subpath from ?__path= rewrite param or request pathname
    let targetPath = url.searchParams.get("__path") || ""
    if (!targetPath) {
      const match = url.pathname.match(/(?:\/api)?\/__clerk\/(.*)/)
      if (match) {
        targetPath = match[1]
      } else if (url.pathname.startsWith("/api/clerk-proxy/")) {
        targetPath = url.pathname.slice("/api/clerk-proxy/".length)
      }
    }

    if (!targetPath.startsWith("/")) {
      targetPath = `/${targetPath}`
    }

    // Build the query string without our internal __path parameter
    const forwardParams = new URLSearchParams(url.searchParams)
    forwardParams.delete("__path")
    const queryString = forwardParams.toString() ? `?${forwardParams.toString()}` : ""
    const targetUrl = `${CLERK_FRONTEND_API}${targetPath}${queryString}`

    // Derive host and proxy URL
    const host =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      "kaizen-33.vercel.app"
    const proto = req.headers.get("x-forwarded-proto") || "https"
    const proxyUrl = `${proto}://${host}/__clerk`

    // Build headers to forward to Clerk
    const forwardHeaders = new Headers()
    req.headers.forEach((value, key) => {
      const lower = key.toLowerCase()
      // Skip hop-by-hop headers
      if (
        lower === "host" ||
        lower === "connection" ||
        lower === "content-length" ||
        lower === "keep-alive" ||
        lower === "transfer-encoding"
      ) {
        return
      }
      forwardHeaders.append(key, value)
    })

    // Inject mandatory Clerk proxy headers
    forwardHeaders.set("Clerk-Proxy-Url", proxyUrl)
    forwardHeaders.set("X-Forwarded-Host", host)
    forwardHeaders.set("X-Forwarded-Proto", proto)

    const secretKey = process.env.CLERK_SECRET_KEY
    if (secretKey) {
      forwardHeaders.set("Clerk-Secret-Key", secretKey)
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1"
    forwardHeaders.set("X-Forwarded-For", clientIp)

    // Check redirect mode: follow asset redirects (e.g. Clerk JS bundles), manual for others
    const isAsset = targetPath.startsWith("/npm/")
    const redirectMode: RequestRedirect = isAsset ? "follow" : "manual"

    const init: RequestInit = {
      method: req.method,
      headers: forwardHeaders,
      redirect: redirectMode,
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = req.body
    }

    const clerkRes = await fetch(targetUrl, init)

    // Build response headers
    const responseHeaders = new Headers()
    clerkRes.headers.forEach((value, key) => {
      const lower = key.toLowerCase()
      // Rewrite internal Location headers pointing back to Clerk's domain
      if (lower === "location") {
        const rewritten = value.replace(CLERK_FRONTEND_API, proxyUrl)
        responseHeaders.set(key, rewritten)
      } else if (lower !== "content-encoding") {
        responseHeaders.append(key, value)
      }
    })

    return new Response(clerkRes.body, {
      status: clerkRes.status,
      statusText: clerkRes.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return new Response(
      JSON.stringify({
        error: "Clerk Proxy Gateway Error",
        message,
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
