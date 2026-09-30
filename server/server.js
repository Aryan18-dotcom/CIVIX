import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// POST Route for Contact Form
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.path ? req.body : req.body;

    // Basic validation check
    if (!name || !email || !message) {
        return res.status(400).json({ 
            success: false, 
            message: "Please fill out all required fields." 
        });
    }

    // Log the incoming submission to the terminal
    console.log("New Contact Form Submission Received:");
    console.log(`- Name: ${name}`);
    console.log(`- Email: ${email}`);
    console.log(`- Message: ${message}`);

    // Simulate successful processing / database save
    setTimeout(() => {
        return res.status(200).json({
            success: true,
            message: `Thank you, ${name}! Your message has been received successfully.`
        });
    }, 800); // 800ms artificial delay to test loading state
});

// Start Server
app.listen(PORT, () => {
    console.log(`CIVIX Backend server running on http://localhost:${PORT}`);
});