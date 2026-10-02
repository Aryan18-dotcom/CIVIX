import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import UserDB from "./models/userModel.js";
import UserCreditsDB from "./models/userCreditsModel.js";
import ReportDB from "./models/reportModel.js";

dotenv.config();

const MONGODB_URI = process.env.Mongodb_URI || "mongodb://localhost:27017/civix_db";

const categories = [
    "Road & Infrastructure",
    "Waste Management",
    "Water & Drainage",
    "Street Lighting",
    "Public Safety",
    "Public Property",
    "Other"
];

const statuses = ["submitted", "reviewed", "updated", "assigned", "working_on_it", "resolved"];

const locations = [
    { address: "Satellite Road, Ahmedabad", coords: [72.5310, 23.0395] },
    { address: "Navrangpura, Ahmedabad", coords: [72.5610, 23.0398] },
    { address: "CG Road, Ahmedabad", coords: [72.5590, 23.0258] },
    { address: "Paldi, Ahmedabad", coords: [72.5620, 23.0125] },
    { address: "Vastrapur, Ahmedabad", coords: [72.5290, 23.0390] },
    { address: "Bopal, Ahmedabad", coords: [72.4697, 23.0338] },
    { address: "Maninagar, Ahmedabad", coords: [72.6014, 22.9976] },
    { address: "Ghatlodia, Ahmedabad", coords: [72.5401, 23.0758] },
    { address: "Prahlad Nagar, Ahmedabad", coords: [72.5115, 23.0129] },
    { address: "Thaltej, Ahmedabad", coords: [72.5126, 23.0524] }
];

const reportTitles = [
    "Deep pothole causing traffic obstruction",
    "Overflowing municipal dustbin and waste scattering",
    "Streetlight pole non-functional for over a week",
    "Drinking water pipeline leakage on main walkway",
    "Damaged footpath posing hazard to senior citizens",
    "Exposed electrical wiring near public park junction",
    "Clogged drainage storm water outlet leading to waterlogging",
    "Faded pedestrian zebra crossing lines near school zone",
    "Stray cattle gathering and blocking traffic flow",
    "Broken public bench and vandalism at community square"
];

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB for database seeding...");

        const shouldReset = process.argv.includes("--reset");
        const shouldClear = process.argv.includes("--clear");

        const adminEmail = process.env.ADMIN_EMAIL || "admin@civix.in";
        const adminUsername = process.env.ADMIN_USERNAME || "Admin";
        const adminPassword = process.env.ADMIN_PASSWORD || "Admin@pass123";

        if (shouldReset) {
            console.log("⚠️ Reset flag detected (--reset). Deleting ALL old data across collections...");
            await Promise.all([
                UserDB.deleteMany({}),
                UserCreditsDB.deleteMany({}),
                ReportDB.deleteMany({})
            ]);
            console.log("All collections wiped completely.");
        } else if (shouldClear) {
            console.log("🧹 Clear flag detected (--clear). Deleting all users, reports, and credit records except the Admin user...");

            // Delete all reports and all user credits
            await Promise.all([
                ReportDB.deleteMany({}),
                UserCreditsDB.deleteMany({})
            ]);

            // Delete all users except the admin email
            await UserDB.deleteMany({ email: { $ne: adminEmail } });

            console.log("Database cleared successfully. Only the Admin account remains.");
            process.exit(0);
        }

        // 1. Ensure Admin Account Exists
        let adminUser = await UserDB.findOne({ email: adminEmail });
        if (!adminUser) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            adminUser = await UserDB.create({
                username: adminUsername,
                email: adminEmail,
                password: hashedPassword,
                userType: "admin",
                displayName: "System Administrator"
            });

            await UserCreditsDB.create({
                userId: adminUser._id,
                username: adminUser.username,
                credits: 150,
                totalWithdrawn: 0,
                validReportsCount: 0,
                history: [{ amount: 150, type: 'bonus', description: 'Admin initial allocation' }]
            });
            console.log(`Admin account created: ${adminUsername} / ${adminEmail}`);
        } else {
            console.log("Admin account verified.");
        }

        // If it was just a clear command, we already exited above. If we are running standard seed or reset, proceed to add 10 users & 50 reports.

        // 2. Seed 10 Users
        const userNames = [
            { username: "AaravShah", email: "aarav@example.com", name: "Aarav Shah" },
            { username: "RiyaPatel", email: "riya@example.com", name: "Riya Patel" },
            { username: "DevMehta", email: "dev@example.com", name: "Dev Mehta" },
            { username: "KavyaDesai", email: "kavya@example.com", name: "Kavya Desai" },
            { username: "KabirJoshi", email: "kabir@example.com", name: "Kabir Joshi" },
            { username: "AnanyaVora", email: "ananya@example.com", name: "Ananya Vora" },
            { username: "RohanThakor", email: "rohan@example.com", name: "Rohan Thakor" },
            { username: "PoojaDave", email: "pooja@example.com", name: "Pooja Dave" },
            { username: "YashParmar", email: "yash@example.com", name: "Yash Parmar" },
            { username: "NehaTrivedi", email: "neha@example.com", name: "Neha Trivedi" }
        ];

        const seededUsers = [];
        for (const uData of userNames) {
            let user = await UserDB.findOne({ email: uData.email });
            if (!user) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash("password123", salt);

                user = await UserDB.create({
                    username: uData.username,
                    email: uData.email,
                    password: hashedPassword,
                    userType: "user",
                    displayName: uData.name
                });

                await UserCreditsDB.create({
                    userId: user._id,
                    username: user.username,
                    credits: 20,
                    totalWithdrawn: 0,
                    validReportsCount: 0,
                    history: [{ amount: 20, type: 'bonus', description: 'Welcome bonus for registering on CIVIX' }]
                });
            }
            seededUsers.push(user);
        }
        console.log(`Successfully ensured ${seededUsers.length} user accounts.`);

        // 3. Seed 50 Reports
        const currentReportCount = await ReportDB.countDocuments();
        if (currentReportCount < 50 || shouldReset) {
            console.log("Seeding 50 detailed reports...");

            const sampleImages = [
                { url: "https://images.unsplash.com/photo-1515260268569-9271009adfdb?auto=format&fit=crop&w=800&q=80", filename: "seed_sample_1.jpg" },
                { url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80", filename: "seed_sample_2.jpg" }
            ];

            for (let i = 1; i <= 50; i++) {
                const author = seededUsers[i % seededUsers.length];
                const loc = locations[i % locations.length];
                const cat = categories[i % categories.length];
                const stat = statuses[i % statuses.length];
                const titleTemplate = reportTitles[i % reportTitles.length];

                const priority = Math.floor(Math.random() * 10) + 1;
                const emergency = Math.floor(Math.random() * 10) + 1;

                // Replace this block inside your 50 reports loop in seed.js:
                const newReport = await ReportDB.create({
                    reportId: `CVX-${1000 + i}`, // Explicitly unique reportId for seed data
                    userId: author._id,
                    report_by_user: author._id.toString(),
                    report_user_displayName: author.displayName || author.username,
                    title: `${titleTemplate} (#${i})`,
                    category: cat,
                    description: `Automated seed report description detailing issue number ${i} reported at ${loc.address}. Requires attention from local authorities.`,
                    location: {
                        address: loc.address,
                        coordinates: { type: "Point", coordinates: loc.coords }
                    },
                    images: sampleImages,
                    issuePriority: priority,
                    emergencyLevel: emergency,
                    status: stat,
                    statusHistory: [
                        { status: "submitted", note: "Initial report submission", changedBy: author._id }
                    ]
                });

                await UserCreditsDB.findOneAndUpdate(
                    { userId: author._id },
                    {
                        $inc: { credits: 5, validReportsCount: 1 }, $push: {
                            history: {
                                amount: 5,
                                type: 'earned_report',
                                description: `Earned 5 credits for submitting report ${newReport.reportId}`,
                                referenceId: newReport._id
                            }
                        }
                    }
                );
            }
            console.log("50 civic reports generated and assigned successfully!");
        } else {
            console.log("Reports database already contains 50+ entries.");
        }

        console.log("Database seeding completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedData();