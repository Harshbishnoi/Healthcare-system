# System & Integration: Server-Side Rendering (SSR) & SEO Guide

This document details the Server-Side Rendering (SSR), React DOM hydration, and search engine optimization (SEO) architecture implemented in the **DocPulse Healthcare Platform**.

---

## 1. Architectural Overview

DocPulse implements an isomorphic / universal **Server-Side Rendering (SSR)** pipeline using **React 19** and **Express.js**. This delivers instantaneous First Contentful Paint (FCP), enhanced Core Web Vitals, and complete Search Engine Optimization (SEO) for medical provider directory pages.

### Dual-Layer SSR Strategy:
1. **Full-Stack Vite SSR Pipeline**:
   - `client/src/entry-server.jsx`: Server entrypoint using `renderToString(<StaticRouter location={url}><App /></StaticRouter>)`.
   - `client/src/entry-client.jsx`: Client hydration entrypoint using `ReactDOM.hydrateRoot(rootElement, <BrowserRouter><App /></BrowserRouter>)`.
   - `server/app.js`: Dynamically loads the pre-built `client/dist/server/entry-server.js` bundle and injects the rendered HTML into `client/dist/index.html` at `<!--ssr-outlet-->` and `<div id="ssr-root" data-ssr="true">`.

2. **Standalone React DOM SSR Engine**:
   - `server/ssr/reactSsrEngine.js`: In-process React component tree (`SsrDoctorDirectory`) rendered to string via `ReactDOMServer.renderToString`.
   - `server/ssr/ssrRenderer.js`: Pre-renders physician profile detail pages with rich metadata and JSON-LD structured schemas.
   - Provides sub-millisecond fallback and zero-dependency reliability in all deployment environments.

---

## 2. Universal / Isomorphic Safety Patterns

In Node.js server environments, browser-specific globals such as `window`, `document`, and `localStorage` are not defined. The codebase enforces strict SSR guards:

```javascript
// client/src/context/AuthContext.jsx
const getInitialUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('docpulse_user');
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    return null;
  }
};
```

---

## 3. SEO & Structured Data (Schema.org JSON-LD)

Each server-rendered physician page embeds Schema.org structured data in JSON-LD format for Google Rich Snippets:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Physician",
  "name": "Dr. Sarah Jenkins",
  "medicalSpecialty": "Cardiology",
  "telephone": "+1-800-555-0199",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "New York"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.9,
    "reviewCount": 128
  }
}
</script>
```

Additionally, standard OpenGraph and Twitter Cards metadata tags (`og:title`, `og:description`, `og:image`, `og:url`) are injected directly into the `<head>` of the server-rendered response.

---

## 4. SSR Route Map

| HTTP Route | SSR Engine | Description |
| :--- | :--- | :--- |
| `GET /` | Full Vite SSR / Standalone | Server-side rendered homepage and directory with full React component tree. |
| `GET /doctors` | Full Vite SSR / Standalone | Server-side rendered search and discovery catalog. |
| `GET /ssr` | Standalone React SSR | Dedicated testable SSR verification route with `<div id="ssr-root">`. |
| `GET /ssr/doctors` | Standalone React SSR | Directory listing pre-rendered via `renderDoctorDirectoryHtml()`. |
| `GET /doctor/:id` | Standalone Profile SSR | Physician detail profile with Schema.org JSON-LD and OpenGraph tags. |
| `GET /ssr/doctor/:id` | Standalone Profile SSR | Direct SSR test endpoint for physician profiles. |

---

## 5. Build & Compilation Pipeline

The root `package.json` provides scripts to build both client assets and SSR server bundles:

```bash
# Build both client bundle and SSR bundle
npm run build

# Or individually
npm run client:build
npm run build:ssr
```

---

## 6. Automated Verification & Testing

The SSR architecture is rigorously tested in:
- `tests/serverSideRendering.test.js`
- `server/tests/serverSideRendering.test.js`

Test coverage verifies:
1. `renderDoctorDirectoryHtml` produces valid HTML documents with `<div id="ssr-root">` and physician listings.
2. `renderDoctorProfileSSR` produces Schema.org JSON-LD structured schemas and OpenGraph tags.
3. `GET /ssr` returns HTTP 200 with server-rendered markup.
4. `GET /ssr/doctor/:id` returns HTTP 200 with physician details and structured metadata.
