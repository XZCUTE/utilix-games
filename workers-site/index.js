/**
 * Cloudflare Workers script for Utilix Games
 * This provides additional control over requests and responses
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Handle requests to our application
 * @param {Request} request
 */
async function handleRequest(request) {
  const url = new URL(request.url)

  // Get the pathname from the URL
  const pathname = url.pathname

  // Serve the site - pass the request through to Cloudflare's asset handler
  try {
    // Attempt to fetch the asset from the site
    const response = await fetch(request)
    
    // If the response is successful, return it
    if (response.status < 400) {
      return response
    }

    // If we got an error response, check if it's a 404
    if (response.status === 404) {
      // SPA Fallback - Serve index.html for all 404s for SPA routing
      if (!pathname.includes('.')) {
        return fetch(`${url.origin}/index.html`)
      }
    }

    // Otherwise, just return the original response
    return response
  } catch (e) {
    // If an error occurs, return an error response
    return new Response('An unexpected error occurred', { status: 500 })
  }
} 