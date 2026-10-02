
# Security Policy

## Project Status

CIVIX is an academic software prototype.

## Reporting a Vulnerability

Do not publish credentials, session cookies, personal data, or exploitable security details in public issues.

Report security concerns privately to the repository maintainer.

## Sensitive Information

Never commit:
- Database connection strings
- Passwords
- Session secrets
- Cloudinary credentials
- API keys
- User personal information

## Authentication

Protected backend endpoints must validate sessions.

Administrator endpoints must validate administrative authorization.

Blocked users must be denied access server-side.

## Data

Synthetic seed records must not be represented as verified real-world civic complaints.

Production deployments should provide appropriate privacy notices and data-handling policies.