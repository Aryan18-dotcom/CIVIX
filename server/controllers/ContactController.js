import { sendContactEmail } from "../utils/sendContactEmail.js"

export const SubmitContactForm = async (req, res) => {
    try {
        const { name, email, message } = req.body || {};

        const cleanName = String(name || "").trim();
        const cleanEmail = String(email || "").trim().toLowerCase();
        const cleanMessage = String(message || "").trim();

        if (!cleanName || !cleanEmail || !cleanMessage) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields.",
            });
        }

        if (cleanName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Name must be 100 characters or fewer.",
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
            });
        }

        if (cleanMessage.length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Message must be 5000 characters or fewer.",
            });
        }

        // IMPORTANT: pass one object with the exact key "email".
        const result = await sendContactEmail({
            name: cleanName,
            email: cleanEmail,
            message: cleanMessage,
        });

        return res.status(200).json({
            success: true,
            message: result.userEmailSent
                ? "Your message has been received. A confirmation email has been sent."
                : "Your message has been received, but the confirmation email could not be sent.",
            emailStatus: {
                adminEmailSent: result.adminEmailSent,
                userEmailSent: result.userEmailSent,
            },
        });

    } catch (error) {
        console.error("[CIVIX Contact Controller]", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to submit your message right now. Please try again later.",
        });
    }
};