
# CIVIX — Agent Instructions

## Project Identity

CIVIX is a civic issue reporting and monitoring web application.

Its primary purpose is to let citizens submit civic complaints, track report statuses, and view their contribution, while administrators manage reports and users.

Project tagline: "The City That Listens."

## Before Making Changes

1. Inspect the existing folder structure.
2. Read the root README.md.
3. Read relevant documentation under docs/.
4. Inspect existing models, routes, controllers, and frontend API calls.
5. Preserve existing working functionality.
6. Do not assume undocumented API fields or endpoints.
7. Do not replace the database architecture without explicit instruction.

## Technology

Frontend:
- HTML
- CSS
- Tailwind CSS
- JavaScript
- AngularJS where already present
- GSAP
- Remix Icons
- Leaflet

Backend:
- Node.js
- Express
- MongoDB
- Mongoose
- Express sessions

## Design System

Primary background: #080D12
Secondary background: #101827
Accent: #C7F36B
Text: #F4F5EF

Fonts:
- Space Grotesk
- DM Sans

Maintain CIVIX's dark, minimal, high-contrast visual identity.

## Frontend Rules

- Maintain responsive behavior.
- Use semantic HTML.
- Preserve accessibility labels.
- Avoid unnecessary dependencies.
- Use native scrolling unless the project explicitly requires otherwise.
- Do not introduce Locomotive Scroll.
- Keep API requests centralized where practical.
- Provide meaningful loading, empty, success, and error states.
- Do not hardcode fake live statistics into production views.

## Backend Rules

- Follow existing ES module conventions.
- Use existing Mongoose models.
- Validate all incoming data.
- Use authentication middleware for protected routes.
- Enforce admin authorization server-side.
- Never trust user IDs supplied by the browser when session identity is available.
- Never store plaintext passwords.
- Do not expose secrets in API responses.
- Use consistent HTTP status codes.
- Avoid destructive database operations unless explicitly requested.

## Authentication

The project uses session-based authentication.

Use the existing session conventions and inspect AuthController before changing authentication behavior.

A blocked account must be rejected server-side on protected requests.

Do not use `is_active = false` as a substitute for the project's `isBlock` field unless the schema and authentication design are intentionally changed.

## Reports

Use the existing report schema and status values.

Before changing report submission:
1. Inspect reportModel.
2. Inspect ReportController.
3. Inspect the upload middleware.
4. Confirm frontend field names.
5. Confirm coordinate order.

GeoJSON coordinates use:
[longitude, latitude]

## Carbon Credits

Do not claim that application credits are verified carbon offsets.

Do not implement credit deductions without:
- Server-side validation.
- Atomic balance updates.
- Transaction/history records.
- Duplicate-request protection.

## Demo Data

Seed data must be clearly identified as synthetic.

Never delete production records as part of a normal seed operation.

Avoid duplicate seed users and reports.

## Security

Never commit:
- .env
- Database credentials
- Session secrets
- Cloudinary secrets
- Private API keys
- Real user data

## Documentation

When changing routes, update docs/API.md.

When changing models, update docs/DATABASE.md.

When changing public pages, update docs/SITEMAP.md and sitemap.xml if applicable.

When changing installation requirements, update README.md.

## Completion Checklist

Before finishing a task:

- Check imports and file paths.
- Check route names.
- Check request and response formats.
- Check responsive layouts.
- Check authorization.
- Check error handling.
- Update relevant documentation.
- Clearly identify untested assumptions.