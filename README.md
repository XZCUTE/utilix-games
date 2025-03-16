ON GOING

## Deployment

This project is configured for easy deployment to Cloudflare Pages.

### Cloudflare Pages Setup

1. Push your repository to GitHub
2. Login to your Cloudflare Dashboard at [dash.cloudflare.com](https://dash.cloudflare.com)
3. Navigate to Pages from the sidebar
4. Click "Create a project" and select "Connect to Git"
5. Select your GitHub repository and configure the following:
   - Project name: `utilix-games` (or your preferred name)
   - Production branch: `main`
   - Build command: (leave empty)
   - Build output directory: `/` (root)
6. Click "Save and Deploy"

Once deployed, you can configure custom domains in the Pages project settings.

### Deployment Files

The following files are included to optimize your Cloudflare Pages deployment:

- `_headers`: Configures security headers and caching policies
- `_redirects`: Handles URL redirects and SPA routing
- `404.html`: Custom error page
- `wrangler.toml`: Configuration for Cloudflare Workers
- `.cloudflare/pages.toml`: Cloudflare Pages configuration
- `functions/_middleware.js`: Server-side middleware for Pages Functions
- `workers-site/index.js`: Advanced request handling with Workers

You can run the deployment helper script to verify your deployment files:

```bash
npm run predeploy
```