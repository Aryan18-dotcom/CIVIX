
# CIVIX Architecture

## Overview

CIVIX follows a frontend/backend architecture.

The frontend communicates with a Node.js and Express API. The backend uses Mongoose models to interact with MongoDB.

## Layers

### Presentation Layer

Responsible for:
- User interface
- Form validation
- Dashboard rendering
- Map display
- API communication

### API Layer

Responsible for:
- HTTP routing
- Authentication middleware
- Authorization
- Request validation
- Response formatting

### Business Logic Layer

Responsible for:
- User operations
- Report creation
- Report status changes
- Credit management
- Admin operations

### Data Layer

Responsible for:
- User persistence
- Report persistence
- Credit records
- Session storage

## Main Entities

User
  |
  | submits
  v
Report

User
  |
  | owns
  v
UserCredits

Administrator
  |
  | manages
  v
Reports and Users

## Geographic Data

Report locations use GeoJSON Point coordinates:

[longitude, latitude]

A 2dsphere index can support geospatial queries.

## Authentication

The application uses Express sessions. Protected operations must validate the authenticated session on the server.

## External Services

Cloudinary may be used for report image storage, depending on environment configuration.