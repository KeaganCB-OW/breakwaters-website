# Breakwaters — SEO Keys & Rationale (Client Folder)

**Last updated:** 2025-11-05

This document explains **what SEO keys/tags/configs were added and _why_**, so a reviewer or teammate can quickly understand the intent and extend the strategy without guesswork.

> **Scope:** React `client/` (excluding heavy dirs like `node_modules`).  
> **Audiences:**  
> - **Leadership:** high‑level goals, KPIs, and risks (first sections)  
> - **Implementers:** concrete keys, code patterns, and checklists (rest of file)

---

## 1) Objectives (Why SEO here matters)
- Grow qualified organic traffic to **candidate intake** and **company sign‑up** pages.
- Improve visibility for **branded** and **service‑intent** keywords.
- Ensure **crawlability**, **index coverage**, and good **Core Web Vitals**.

**Primary KPIs**
- Impressions & clicks (Google Search Console)
- Conversions (GA4): resume submits, company registrations
- Coverage: 100% of intended pages indexed
- CWV: LCP < 2.5s, INP < 200ms

---

## 2) Environment Keys (`client/.env`) — What & Why

> React only exposes variables prefixed with `REACT_APP_` at build time. This keeps sensitive config out of source and makes per‑environment changes explicit.

**Examples**
```
REACT_APP_API_BASE_URL=https://api.example.com
REACT_APP_SITE_URL=https://www.example.com
REACT_APP_FEATURE_X=true
```

**Why**
- **Runtime configuration** without hardcoding.
- Enables **canonical** construction, sharing images, or dynamic titles based on env.
- Clear separation of **dev/stage/prod** values.

**Notes**
- Only add keys you truly need client‑side. Server secrets must **never** be exposed here.

---

## 3) Public Head Tags (`client/public/index.html`) — What & Why

| Item | Why it exists |
| --- | --- |
| `<title>` | Core SERP headline + browser tab text |
| `<meta name="description">` | Influences SERP snippet and **CTR** when aligned to intent |
| **Open Graph** (og:title/og:description/og:image) | Correct social share previews |
| **Twitter Card** (`name="twitter:*"`) | Consistent preview on Twitter/X |
| `<link rel="canonical">` | Consolidates signals; avoids duplicates |
| **Favicon / `manifest.json`** | Brand consistency, PWA metadata |
| **`robots.txt`** | Controls what bots crawl; points to sitemap |
| **`sitemap.xml`** | Discovery & coverage; submitted to GSC |
| **Google Analytics (gtag)** | Measures organic impact + conversions |
| **GSC Verification** | Ownership to request indexing & view coverage |

> Titles/descriptions for **each route** are set via a central component (see **PageMeta** below).

---

## 4) Central Metadata Component (`client/src/components/seo/PageMeta.js`) — Why

**Why**
- Enforces **unique title/description** per route.
- Provides a single place to manage **canonical**, **Open Graph**, and **Twitter** tags.
- Reduces copy‑paste mistakes; speeds code review via a consistent **pattern**.

**Usage Pattern**
```jsx
import PageMeta from "../components/seo/PageMeta";

export default function AboutUsPage() {
  return (
    <>
      <PageMeta
        title="About Breakwaters — Human‑Centered Recruitment"
        description="Learn how Breakwaters connects candidates with verified companies through a curated process."
        canonical="https://www.example.com/about"
        // Optional: ogTitle, ogDescription, ogImage, twitterCard, etc.
      />
      {/* Page content ... */}
    </>
  );
}
```

**Keys & intent**
- `title` → concise, descriptive, keyword‑aligned; improves **CTR**
- `description` → 1–2 sentences matching **searcher intent**
- `canonical` → consolidates link equity; avoids **duplication**
- `ogTitle`/`ogDescription`/`ogImage` → correct **social previews**
- `twitterCard` → ensures **Twitter/X** previews

---

## 5) Crawl Controls — `robots.txt` & `sitemap.xml`

**Why**
- `robots.txt` ensures bots can crawl intended paths and **references the sitemap**.
- `sitemap.xml` is submitted to **Google Search Console** to improve discovery and coverage.

**Checks**
- Allow public routes; disallow private/admin as appropriate.
- Keep `sitemap.xml` updated when adding/removing important pages.

---

## 6) Measurement Keys — GA4 & Search Console

**Why**
- **GA4** measures organic traffic & conversions; validates impact of improvements.
- **GSC** (Search Console) verifies site ownership to request indexing and monitor coverage and **Core Web Vitals**.

**Best Practices**
- Anonymize IP where possible and reflect in privacy notice (POPIA/GDPR).
- Define conversions (e.g., **Resume Submit**, **Company Registration**).

---

## 7) Structured Data (JSON‑LD) — What & Why

**Why**
- Improve eligibility for **rich results** and strengthen entity understanding.
- Provide clear context for brand, site, and page relationships.

**Recommended Types**
- **Organization** (brand, logo, sameAs)
- **WebSite** + **SearchAction** (sitelinks search box)
- **BreadcrumbList** (path context in SERP)
- **HowTo** for intake flows (Become Client / Resume Submit)

**Examples (add via `react-helmet` or `dangerouslySetInnerHTML`)**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Breakwaters",
  "url": "https://www.example.com",
  "logo": "https://www.example.com/logo.png"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://www.example.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.example.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>
```

---

## 8) Media & ALT — What & Why

**Why**
- Descriptive, hyphenated **filenames** help clarity and image search.
- Fixed **width/height** prevents CLS and improves **CWV**.
- Meaningful `alt` attributes improve **accessibility** and context.

**Checklist**
- Prefer **WebP** (or AVIF) when quality allows.
- Add `loading="lazy"` to offscreen images.
- Compress large assets and use responsive sizes.

---

## 9) Internal Linking & IA — What & Why

**Why**
- Descriptive anchors help both users and bots understand relationships.
- Logical navigation supports key journeys (e.g., Candidate → Details → Submit).
- Contextual links reduce pogo‑sticking and improve crawl depth.

**Patterns**
- Header/footer: Home, About, Become Client, Company List, Login/Signup
- Contextual: CandidateList → ClientDetails; Company pages → Register/Contact

---

## 10) Accessibility & Performance — What & Why

**Why**
- Semantic HTML and accessible controls help all users and **support better indexing**.
- Faster pages correlate with **better engagement** and rankings via Page Experience.

**Checklist**
- Semantic landmarks: `<header>`, `<main>`, `<nav>`, `<footer>`
- Visible focus states; ARIA labels for icon‑only buttons
- Preload critical fonts; `font-display: swap`
- Minimize blocking JS; defer/async where possible
- Lazy‑load offscreen images; compress & cache static assets

---

## 11) Implementation Playbook

**Per‑Route On‑Page Checklist**
- [x] Unique `<title>` (~55–60 chars) & `<meta name="description">` (~155–160 chars)
- [x] Exactly one `<h1>`; use `<h2>/<h3>` for sections
- [x] Canonical URL set
- [x] Descriptive internal links
- [x] Images have `alt`, optimized format/size, and fixed dimensions

**Technical**
- [x] `robots.txt` allows intended paths and references `sitemap.xml`
- [x] `sitemap.xml` kept current and submitted to GSC
- [x] SPA rewrites configured on server/CDN for deep links
- [x] JSON‑LD added where relevant (Org/WebSite/Breadcrumb/HowTo)

**Measurement**
- [x] GA4 measurement ID installed & validated
- [x] Conversions defined (Resume Submit / Company Registration)
- [x] GSC ownership verified; Coverage & CWV monitored

---

## 12) Reviewer Notes (What to look for)
- Each key/tag is present **for a reason** — explained above.
- Code follows a **centralized** pattern (`PageMeta`) to avoid drift.
- Crawl + measurement tooling are **configured** to validate outcomes.
- The setup is **maintainable** for future routes and content.

---

## 13) Appendix — PageMeta Skeleton (for reference)
```jsx
import {{ Helmet }} from "react-helmet";

export default function PageMeta({{ title, description, canonical, ogTitle, ogDescription, ogImage, twitterCard }}) {{
  return (
    <Helmet>
      {{title && <title>{{title}}</title>}}
      {{description && <meta name="description" content={{description}} />}}
      {{canonical && <link rel="canonical" href={{canonical}} />}}

      {{ogTitle && <meta property="og:title" content={{ogTitle || title}} />}}
      {{ogDescription && <meta property="og:description" content={{ogDescription || description}} />}}
      {{ogImage && <meta property="og:image" content={{ogImage}} />}}

      {{twitterCard && <meta name="twitter:card" content={{twitterCard}} />}}
    </Helmet>
  );
}}
```

---

### How to Use This File
- Keep this document in the repo (e.g., `client/docs/SEO_KEYS_AND_RATIONALE.md` or at root).
- Update when adding routes, structured data, or new env keys.
- Use the **per‑route checklist** during PR reviews.
