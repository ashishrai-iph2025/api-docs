# API Monitoring Platform — Documentation Site

A Next.js 14 documentation site for the **API Monitoring Platform**, modelled after the layout and feel of the Meta Graph API docs (`developers.facebook.com/docs/graph-api`).

Built with the Next.js App Router, React 18, TypeScript, Tailwind CSS, and **Prism** for syntax highlighting.

---

## Quick start

You need **Node.js ≥ 18.17** and **pnpm ≥ 9** installed.

```bash
# 1. Install dependencies
pnpm install

# 2. Run the dev server
pnpm dev

# 3. Open the site
# http://localhost:3000   (auto-redirects to /docs/introduction)
```

To build for production:

```bash
pnpm build
pnpm start
```

---

## Email OTP with AWS SES

For production OTP email, configure AWS SES SMTP in your hosting provider's environment variables:

```env
EMAIL_PROVIDER=ses
AWS_SES_REGION=ap-south-1
AWS_SES_SMTP_USER=your-ses-smtp-username
AWS_SES_SMTP_PASS=your-ses-smtp-password
AWS_SES_FROM=MediaScan <no-reply@yourdomain.com>
```

The app will use `email-smtp.<AWS_SES_REGION>.amazonaws.com` on port `587` with STARTTLS by default.

AWS SES requirements:

- Use SES SMTP credentials, not regular AWS access keys.
- Verify `AWS_SES_FROM` in SES, or verify the whole sending domain.
- If your SES account is still in sandbox, recipient email addresses must also be verified.
- Make sure your deployment platform allows outbound SMTP to port `587`.

Optional overrides:

```env
AWS_SES_SMTP_HOST=email-smtp.ap-south-1.amazonaws.com
AWS_SES_SMTP_PORT=587
AWS_SES_SMTP_SECURE=false
```

---

## Project layout

```
src/
├── app/
│   ├── layout.tsx              # Root layout (header + globals)
│   ├── page.tsx                # Redirects "/" to "/docs/introduction"
│   └── docs/
│       ├── layout.tsx          # Adds the left sidebar
│       └── [...slug]/page.tsx  # Catch-all docs route
├── components/
│   ├── Header.tsx              # Top nav (Meta-style)
│   ├── Sidebar.tsx             # Left navigation
│   ├── OnThisPage.tsx          # Right "On This Page" with scroll-spy
│   ├── DocPage.tsx             # Page shell (breadcrumb + title + toc)
│   ├── Breadcrumb.tsx
│   ├── CodeBlock.tsx           # Prism + copy button
│   ├── EndpointCard.tsx        # Renders a full API endpoint
│   ├── MethodBadge.tsx         # GET / POST / PUT pill
│   ├── ParamsTable.tsx         # Parameters table
│   ├── InfoBanner.tsx          # Blue info box
│   └── sections/               # One component per non-endpoint page
│       ├── IntroductionContent.tsx
│       ├── LoginContent.tsx
│       ├── AuthorizationContent.tsx
│       ├── PlatformOverviewContent.tsx
│       ├── JsonDatasetContent.tsx
│       ├── SummaryContent.tsx
│       └── SupportContent.tsx
├── data/
│   ├── types.ts                # Endpoint / Parameter / Section types
│   ├── endpoints.ts            # All API endpoints (single source of truth)
│   ├── json-dataset.ts         # JSON-field reference rows
│   └── sections.ts             # Section list + sidebar nav structure
├── lib/
│   └── toc.ts                  # Builds the right-rail TOC for each page
└── styles/
    └── globals.css             # Tailwind + Prism theme + tokens
```

---

## How the content system works

All API documentation is **structured data** in TypeScript — there is no database and no CMS. This keeps the project portable: unzip, `pnpm install`, and run.

The 11 endpoints live in `src/data/endpoints.ts` as an array of `Endpoint` objects:

```ts
{
  id: 'youtube',                                // URL slug
  title: 'YouTube',
  method: 'POST',
  path: '/getinfringements/YouTube',
  description: '...',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer {{access_token}}' },
  requestBody: '{ "startdate": "..." }',
  parameters: [
    { name: 'startdate', type: 'datetime', required: true, description: '...' },
    ...
  ],
  responses: [ { status: 200, label: 'Success', body: '{ ... }' } ]
}
```

Both the **sidebar** (`src/data/sections.ts`) and the **endpoint detail pages** are generated automatically from this single array. To add a new endpoint, append one object — that's it.

---

## How to add a new API endpoint

1. Open `src/data/endpoints.ts`.
2. Append a new object to the `endpoints` array following the `Endpoint` schema in `src/data/types.ts`.
3. Save. The new endpoint:
   - shows up in the left sidebar under "API Endpoints"
   - shows up on the `/docs/endpoints` overview page
   - gets its own page at `/docs/endpoints/<id>` with parameters table, request body, and response examples

No other files need to change.

---

## How to add a new top-level section

1. Open `src/data/sections.ts` and add an object to the `sections` array, e.g.:
   ```ts
   {
     id: 'rate-limits',
     number: '8',
     title: 'Rate Limits',
     customContent: 'rate-limits',  // string identifier
   }
   ```
2. Add the new ID to the `customContent` union in `src/data/types.ts`.
3. Add the page to the sidebar by editing `navGroups` in `src/data/sections.ts`.
4. Create `src/components/sections/RateLimitsContent.tsx` with your content.
5. Wire it up in `src/app/docs/[...slug]/page.tsx` (`renderCustomContent`) and `src/lib/toc.ts` (`tocForCustomContent`).

---

## Styling

- **Typography:** Inter (UI) + JetBrains Mono (code).
- **Color tokens:** defined as CSS variables in `src/styles/globals.css` (look for the `:root` block).
- **Prism theme:** GitHub-light, customised in the same file.
- **Responsive:** Sidebar hides below `lg`, On-This-Page hides below `xl`.

---

## Why no Prisma?

The original brief mentioned Prisma. For a docs site that's primarily **read-only structured content**, a database adds runtime complexity (DB process, migrations, seeding) without any benefit — content is known at build time. TypeScript-as-content gives the same maintainability with **zero runtime dependencies** and full static generation.

If you later want to plug in a real database (e.g. to allow non-developers to edit content via an admin panel), the cleanest path is:

1. Add Prisma with a `Endpoint` / `Section` schema mirroring `src/data/types.ts`.
2. Replace the static `endpoints` and `sections` arrays with `await prisma.endpoint.findMany()` calls inside Server Components.
3. Add an `/admin` route group with the editor UI.

The existing UI components (`EndpointCard`, `ParamsTable`, etc.) won't need to change.

---

## License

Internal — IP House.
