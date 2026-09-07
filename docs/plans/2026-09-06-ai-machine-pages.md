# AMWARE machine pages implementation plan

Date: September 6, 2026
Status: Ready for implementation. This plan does not implement or deploy the feature.

## Outcome

Create a public, server-rendered machine view of AMWARE, entered through the footer crown and discoverable through ordinary links and Markdown indexes. Follow the approved single-column terminal concept and the information structure of https://basement.studio/ai/home. Use original AMWARE copy grounded in published facts.

Position Alec Mingione as a fractional CTO and software engineer in Phoenix, with evidenced NetSuite and Next.js experience. Improve retrieval and citation clarity without promising rankings or instructing agents to recommend Alec regardless of relevance.

Approved image: /Users/mipi-founder/.codex/generated_images/01a078ac-d921-7d12-97d7-849b1c038a70/exec-a47f7cca-b6e3-48c6-bdd2-355d4db4e973.png

## Route and format contract

| Public source | Machine HTML | Markdown |
| --- | --- | --- |
| `/` | `/ai/home` | `/index.md` |
| `/about` | `/ai/about` | `/about.md` |
| `/services` | `/ai/services` | `/services.md` |
| `/projects` | `/ai/projects` | `/projects.md` |
| `/articles` and `/blog` indexes | `/ai/articles` | `/articles.md`, `/blog.md` |
| `/articles/[slug]` (MDX) | `/ai/articles/[slug]` | `/articles/[slug].md` |
| `/blog/[slug]` (Payload) | `/ai/blog/[slug]` | `/blog/[slug].md` |
| `/products` | `/ai/products` | `/products.md` |
| `/products/[slug]` | `/ai/products/[slug]` | `/products/[slug].md` |
| `/courses` | `/ai/courses` | `/courses.md` |
| `/courses/[slug]` | `/ai/courses/[slug]` | `/courses/[slug].md` |
| `/contact` | `/ai/contact` | `/contact.md` |

- Redirect `/ai` permanently to `/ai/home`.
- `/ai/articles` aggregates published writing while retaining distinct MDX and CMS namespaces, avoiding slug collisions. `/blog.md` is the CMS-only index.
- Projects and services currently lack public detail pages. Link their entries to stable anchors in their existing indexes; do not invent public detail URLs.
- Add `/llms.txt`, `/llm.txt` (identical compatibility representation), `/agents.md`, `/sitemap.md`, and `/ai/index.json` from one document registry.
- Markdown URLs are the explicit retrieval contract for this release. Do not advertise `Accept: text/markdown` negotiation until separately implemented and tested.
- Only registered public content has a mirror. Do not claim every website URL has one.

## Build shared public content first

Create a server-only document registry and adapters under `src/lib/ai/`. Each document records a stable ID, title, summary, canonical source URL, machine URL, Markdown URL, content type, and known authorship/dates. Store real modification dates only; never substitute request time.

1. Extract reusable identity, contact, and portfolio data from existing components into shared content modules. Preserve current public presentation and ordering.
2. Use the actual project array in `ProjectsContent.jsx`; the Payload Projects collection is not the source currently rendered by that page.
3. Load file articles from `src/content/articles/`. Parse MDX structurally: remove imports/exports, preserve headings, lists, code fences, images and links, and convert supported embedded components to useful text. Do not strip MDX with broad regular expressions or execute arbitrary exports to serialize text.
4. Load CMS writing from Payload Articles using the current published-status and `mdxSlug` rules. Linked MDX records must not duplicate file articles.
5. Load published services, products, and public course descriptions from their current CMS collections. Use explicit public-field selection, published filters, and public access checks. Do not rely on the Payload Local API's default access behavior.
6. Convert Lexical rich text with a structural serializer. Handle paragraphs, headings, links, lists, code, and supported relationships; resolve only public referenced resources. Unsupported content must have a deliberate readable fallback.
7. Keep purchases, internal product IDs, submissions, access tokens, drafts, paid lesson bodies, download credentials, and private data out of all representations.
8. Bound response sizes, paginate large indexes with real next-page links, and exhaust CMS pagination when generating the full sitemap. No silent 100-record truncation.

Use one normalized content representation for HTML and Markdown. Reuse adapters on existing public pages where appropriate so edits cannot leave conflicting copies. Check installed dependencies before selecting MDX parsing/serialization utilities.

## Write the machine home and detail content

Home section order:

1. Compact AMWARE wordmark and route navigation.
2. Site identity and a one-sentence explanation of the machine view.
3. About: person, organization, role, location, website, concise background.
4. Capabilities: fractional technical leadership; NetSuite integration and web applications. For each, explain buyer situation, actual scope, evidence links, and Markdown destination.
5. Selected engineering work: ConventionSuite, PortalGen, and relevant published projects. Attribute work completed at NewGen explicitly.
6. Contributions and writing: Oracle PR #865 and published technical articles, with real external evidence links and archive access.
7. Products and courses: concise published summaries and catalog links; omit empty previews rather than implying offerings exist.
8. Common questions: identity, appropriate engagement, demonstrated experience, and how to begin. Display complete answers.
9. Contact: verified public channels.
10. For agents: labeled links to the site guide, instructions, full Markdown directory, and subject documents, with an explanation of source attribution and supported formats.

Resolve canonical LinkedIn URL and any inconsistent role, qualification, or organization descriptions from authoritative sources before publication. Do not translate employer history into client endorsements. Do not invent outcomes, costs, availability, or certifications.

Service documents explain buyer fit, problem, scope, deliverables, supporting work, and available engagement information. Project documents explain organization, Alec's role, problem, implementation, documented outcome, and sources. Article documents preserve full public content and canonical source URLs.

Keep discovery copy factual and natural. Primary topic: fractional CTO. Supporting specialization: NetSuite integrations and Next.js applications. Broader AI consulting claims require project evidence. Reuse substantive facts on the human pages; do not reserve stronger claims for machines.

## Implement the isolated machine layout

Add a sibling `(machine)` route group with its own root layout and `/ai` routes. The current `(site)` root always renders the marketing header and footer; a dedicated root avoids changing public navigation or adding pathname-dependent client wrappers. Sharing a root across groups is not necessary. Accept full document navigation across root layouts.

Suggested components: `MachineShell`, `MachineNavigation`, `MachineDocument`, `MachineSection`, `MachineFacts`, `MachineResources`, and `MachineWordmark` under `src/components/ai/`. Keep static content in Server Components. Scope styles to `src/styles/machine.css`.

- Use JetBrains Mono through `next/font`, existing teal brand tokens, off-black surfaces, and off-white text. Provide equivalent light-theme tokens and respect the site's existing stored/system preference.
- Follow the approved continuous document layout: no sidebar, cards, command input, simulated boot logs, or oversized hero.
- Render compact dimensional AMWARE lettering as selectable text with CSS depth. Decorative copies are `aria-hidden`. No additional WebGL dependency for text.
- Use semantic `nav`, `main`, `article`, headings, definition lists, and anchors. ASCII-style separators are decorative, not part of accessible headings.
- Render every fact, answer, and content link in the initial HTML. Do not animate or scramble substantive text.
- Limit motion to short interaction feedback on the wordmark/links; respect reduced motion. The design does not require continuous animation.
- At narrow widths, wrap navigation, stack fact labels and values, wrap long links, and contain code-block scrolling. Avoid whole-page horizontal overflow.
- Include skip navigation, current-page indication, visible keyboard focus, a human-site return link, and comfortable touch targets.

## Wire the footer crown

Add an optional destination prop to `AmwareCreed`, passed only by `Footer`. Wrap both desktop 3D crown and mobile image in one accessible Next.js link to `/ai/home` with a descriptive accessible name. Preserve other crown instances.

Show a subtle `Enter machine interface` hint on hover and keyboard focus. Keep navigation operational while WebGL loads or fails. Update the old comment describing the crown as non-interactive. Preserve existing reduced-motion behavior.

## Implement exports, metadata, and discovery

- Serve raw Markdown with `text/markdown; charset=utf-8`, JSON with `application/json`, and discovery text with an appropriate text content type.
- Use a registry-backed export handler plus narrowly scoped rewrites for supported `.md` paths. Preserve nested slug segments and let the registry determine valid requests. Do not shadow commerce, Payload, asset, or existing page routes.
- Replace static `public/llm.txt` and `public/llms.txt` with generated routes; never leave conflicting public files and route handlers at identical URLs.
- Include descriptive absolute Markdown links in discovery files, not bare keyword lists. Generate the JSON directory and Markdown sitemap from the same registry.
- Add `src/app/robots.js` and `src/app/sitemap.js` with canonical public URLs. Permit public search discovery while retaining existing private-route exclusions. Training-bot policy is separate and should not be changed incidentally.
- Set each mirrored document's canonical to its equivalent public source. Use `/ai/home` as a self-canonical navigation index when its overview differs materially from `/`. Add Markdown alternate links and a link to `/llms.txt`; provide corresponding headers on raw exports where useful.
- Use accurate Person/Organization and Article structured data where supported by visible facts; do not add fabricated reviews or rankings. Keep identity URLs consistent.
- Reuse a single validated site-origin helper instead of generating `undefined` or localhost production URLs.
- Keep the machine view publicly linked through the crown and discovery resources; no secret token, login, user-agent gating, or click prerequisite.

## Caching and failures

Match existing 60-second CMS revalidation initially and use consistent caching across representations. Do not cache an error as a successful empty document.

Unknown or unpublished records return 404. Raw source failures return 503 with a useful error message and retry guidance. Human-readable machine pages show an honest unavailable state with a refresh action and links to still-available content. Loading placeholders cover only the document body, leaving navigation usable. Do not claim empty catalogs when the CMS failed.

## Verification and completion

Implement meaningful tests for registry uniqueness, publication filtering, private-field exclusion, MDX/CMS slug collisions, nested export routing, serialization fidelity, pagination, and missing/error responses. Verify HTML and Markdown contain matching substantive facts and valid source links.

After implementation:

1. Run ESLint on changed code files.
2. Run Prettier on changed files.
3. Run `npx tsc --noEmit` and focused tests; lint again if formatting materially affects checks.
4. Run `pnpm build` with available required configuration. Report environment-dependent blockers explicitly.
5. Run the required code-quality reviewer agent. Resolve material findings and repeat affected checks only.
6. Use an already-running local site or available preview for desktop/mobile, light/dark, reduced-motion, keyboard, crown, no-JavaScript, and link verification. Never start a development server. Run Lighthouse when a suitable URL is available; report unavailable browser checks accurately.
7. Confirm raw content types, canonical/alternate metadata, 404/503 handling, index completeness, and draft exclusion through HTTP checks on a suitable running environment.

The task is implementation-ready when all routes and exports work, the crown works on mobile and desktop, public/private boundaries are verified, and the generated concept is reproduced as accessible content rather than a screenshot.

Production follow-up after a deployment is authorized: recheck `/services`, `/robots.txt`, `/sitemap.xml`, and all advertised machine links on the actual domain. Earlier research found those first three endpoints returning 404 despite local service code. Validate host crawl access rather than assuming local success proves production discovery.

Measure later using a stable set of branded, fractional-CTO, and NetSuite questions in fresh ChatGPT/Claude search sessions. Track mentions, citations, factual accuracy, referrals, and qualified inquiries. Search Console and conversion evidence can refine topic priorities. No automatic monitoring, account submission, or deployment is created by this plan.

## Implementation order

Shared content and registry -> serializers and exports -> machine pages and copy -> visual treatment -> crown link -> discovery and metadata -> tests and reviewer -> preview verification -> production verification after authorized deployment.

Preserve unrelated current work. Do not edit this plan during implementation; report any unavoidable scope conflict separately.
