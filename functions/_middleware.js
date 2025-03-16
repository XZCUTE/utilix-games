/**
 * Cloudflare Pages Functions middleware
 * This allows adding server-side functionality to Cloudflare Pages
 */

export async function onRequest({ request, next, env }) {
  // Get the URL information
  const url = new URL(request.url)
  const path = url.pathname
  
  // Use this space to modify the request or response
  // For example, add custom headers
  const response = await next()
  
  // Clone the response so we can modify headers
  const newResponse = new Response(response.body, response)
  
  // Add custom headers
  newResponse.headers.set('X-Powered-By', 'Utilix Games')
  
  // You could implement custom caching, authentication, etc. here
  
  return newResponse
} 