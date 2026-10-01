import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/DB.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import AuthRouter from './routes/AuthRouter.js';
import ManageAccountRouter from './routes/ManageAccountRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const app = express();

// 1. Database Connection
// Ensure your connectDB logic checks for existing connections
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../client')));

// 2. Security Headers for Production
if (isProduction) {
    app.set('trust proxy', 1); // Required for Vercel/proxies to pass cookies
}

// 3. CORS Configuration
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "http://localhost:3000"
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || !isProduction) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json());

// 4. Session & Cookie Logic
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'civix_session',
    cookie: { 
        // Secure is TRUE in production (requires HTTPS)
        secure: isProduction, 
        httpOnly: true, 
        maxAge: 1000 * 60 * 60 * 24 * 7, 
        // SameSite is 'none' for cross-domain cookies in prod, 'lax' for local dev
        sameSite: isProduction ? "none" : "lax" 
    },
    store: MongoStore.create({
        mongoUrl: process.env.Mongodb_URI,
        collectionName: 'sessions',
        ttl: 60 * 60 * 24 * 7 // 7 days
    })
}));

// 5. Routes
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'Server is Live!', 
        env: process.env.NODE_ENV,
        time: new Date().toISOString()
    });
});
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        time: new Date().toISOString(),
        messge: 'Server is healthy and running smoothly.'
    });
});

// 6. Services Routes
app.use('/api/auth', AuthRouter);
app.use('/api/manage-account', ManageAccountRouter);


if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode at http://localhost:${port}`);
    });
}

export default app;