# CIVIX backend additions

## Add dependencies
`npm install multer`

## Mount in server.js
Add imports:
```js
import DashboardRouter from './routes/DashboardRouter.js';
import ReportRouter from './routes/ReportRouter.js';
import CarbonRouter from './routes/CarbonRouter.js';
import LeaderboardRouter from './routes/LeaderboardRouter.js';
```
After `app.use(express.json())` and session middleware, mount:
```js
app.use('/api/dashboard', DashboardRouter); // one GET for all dashboard data
app.use('/api/reports', ReportRouter);
app.use('/api/carbon-credits', CarbonRouter);
app.use('/api/leaderboard', LeaderboardRouter);
app.use('/uploads', express.static(path.resolve('uploads')));
```
Dashboard frontend should call only `GET /api/dashboard` for dashboard initial data. Other routes are for report submission, my reports, nearby map refresh, etc.

## Report form contract
Use FormData keys: title, category, description, address, latitude, longitude, priority, emergency, and repeated `photos` file fields. Do not manually set Content-Type for FormData; browser sets multipart boundary.

## Notes / adapt before production
- Existing auth middleware must set `req.session.userId`; this code uses that existing session contract.
- Status updates expect `req.user.userType === 'admin'`. If your middleware exposes user differently, add a DB-backed role check before deployment.
- `UserCreditsDB` currently stores `credits`; carbon fields here treat one credit as the dashboard's illustrative 1 metric-ton convention. Do not present this as verified carbon offsets.
- Civic score currently means 10 points per resolved report; define anti-abuse/verification policy before real deployment.
- `GET /api/reports/:id` currently requires login but does not restrict report owner; add privacy/authorization rules if reports are private.
- Local disk uploads are suitable for development; use object storage and validate file contents in production.
- Add global multer error handling and rate limits before public deployment.
- Ensure `Mongodb_URI` and `SESSION_SECRET` are configured. Keep `connectDB()` awaited before accepting requests for production readiness.
