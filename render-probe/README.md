# Public LFP network-only probe for Render Free

This branch does **not** publish the financial API, Google OAuth or private credentials. The only Node endpoint is `GET /health` (also available on `/`).

## Browser-only deploy

1. Sign in to https://dashboard.render.com.
2. New → Web Service → **Public Git Repository** (if offered).
3. Repository URL: `https://github.com/ndinar1982/ndinar1982.github.io`.
4. Branch: `lfp-render-network-probe`.
5. Root Directory: `render-probe`, Language: Node, Build: `npm install --omit=dev`, Start: `npm start`.
6. Instance Type: **Free**. No secrets, bank card, or payment setup needed for this probe.
7. Open the generated HTTPS `https://<service>.onrender.com/health` without VPN on the target laptop and on a phone with mobile data.

Expected JSON contains `"service":"lfp-render-probe"`, `"financial_api_enabled":false`, `"oauth_enabled":false`.

If the Render dashboard requires an app connection, only give access to the public repo (or stop); **do not** authorize access to the private financial repo just for this probe.

The GitHub Pages production site is deployed from the separate `main` branch and is unaffected.
