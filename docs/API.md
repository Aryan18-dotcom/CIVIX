
# CIVIX API Reference

Base URL:

Development: http://localhost:3000

Production: Configure according to deployment.

## Authentication

### POST /api/auth/login

Purpose: Authenticate a user.

Authentication: Public.

### POST /api/auth/register

Purpose: Create an account.

Authentication: Public.

### GET /api/auth/current-user

Purpose: Retrieve the current session user.

Authentication: Required.

### POST /api/auth/logout

Purpose: End the current session.

Authentication: Required.

## Reports

### POST /api/reports

Purpose: Submit a civic issue.

Authentication: Required.

Content type: Confirm multipart/form-data configuration.

Potential fields:
- title
- category
- description
- address
- latitude
- longitude
- priority
- photos

Confirm exact field names and validation in ReportController.

## Admin

### GET /api/admin/reports

Purpose: Retrieve reports for administrative review.

Authentication: Required.

Authorization: Admin.

### PATCH /api/admin/reports/:id/update

Purpose: Update report status or supported report fields.

Authentication: Required.

Authorization: Admin.

### POST /api/admin/users/:userId/toggle-block

Purpose: Toggle a user's block state.

Authentication: Required.

Authorization: Admin.

## Account Management

### PUT /api/manage-account/update-profile

Purpose: Update profile information.

Authentication: Required.

## API Documentation Rules

For every endpoint, document:

1. HTTP method.
2. Full route.
3. Authentication requirement.
4. Authorization requirement.
5. Request content type.
6. Request body.
7. Success response.
8. Error responses.
9. Validation rules.
10. Example request.