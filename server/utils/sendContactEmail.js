
import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const CONTACT_EMAIL =
    process.env.CONTACT_EMAIL || "aryanchheda18@gmail.com";

if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error(
        "Missing EMAIL_USER or EMAIL_PASS in environment variables."
    );
}

const port = Number(process.env.SMTP_PORT || 465);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure:
        String(process.env.SMTP_SECURE || "true").toLowerCase() === "true",
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

const CIVIX = {
    midnight: "#080D12",
    deep: "#101827",
    lime: "#C7F36B",
    ivory: "#F4F5EF",
    muted: "#A0A8A5",
};

const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[char]);

const emailLayout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CIVIX — The City That Listens</title>
</head>
<body style="margin:0;padding:0;background:${CIVIX.midnight};font-family:Arial,Helvetica,sans-serif;color:${CIVIX.ivory};">

<table width="100%" cellpadding="0" cellspacing="0" style="background:${CIVIX.midnight};padding:35px 12px;">
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0"
style="max-width:600px;background:${CIVIX.deep};border:1px solid #26332D;border-radius:14px;overflow:hidden;">

<tr>
<td align="center" style="padding:32px 20px 25px;">
<div style="font-size:36px;font-weight:800;letter-spacing:7px;color:${CIVIX.ivory};">
CIVI<span style="color:${CIVIX.lime};">X</span>
</div>
<div style="margin-top:8px;font-size:10px;letter-spacing:3px;color:${CIVIX.muted};">
THE CITY THAT LISTENS
</div>
</td>
</tr>

<tr>
<td style="height:2px;background:${CIVIX.lime};font-size:0;">&nbsp;</td>
</tr>

<tr>
<td style="padding:32px 26px 38px;">
${content}
</td>
</tr>

<tr>
<td align="center" style="padding:24px;background:${CIVIX.midnight};border-top:1px solid #26332D;">
<p style="margin:0;font-size:13px;line-height:1.7;color:${CIVIX.muted};">
Building better cities, one voice at a time.
</p>
<p style="margin:12px 0 0;font-size:11px;letter-spacing:2px;color:${CIVIX.lime};">
SEE IT · REPORT IT · CREATE CHANGE
</p>
<p style="margin:18px 0 0;font-size:11px;color:#66716D;">
© ${new Date().getFullYear()} CIVIX. All rights reserved.
</p>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>
`;

const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const verifyEmailTransport = async () => {
    await transporter.verify();
    return true;
};

export const sendContactEmail = async ({
    name,
    email,
    message,
} = {}) => {
    const cleanName = String(name || "").trim();
    const recipient = String(email || "").trim().toLowerCase();
    const cleanMessage = String(message || "").trim();

    if (!cleanName || !recipient || !cleanMessage) {
        throw new Error("Name, email and message are required.");
    }

    if (!isValidEmail(recipient)) {
        throw new Error("Invalid visitor email address.");
    }

    if (!CONTACT_EMAIL || !isValidEmail(CONTACT_EMAIL)) {
        throw new Error("Invalid CONTACT_EMAIL configuration.");
    }

    const safeName = escapeHTML(cleanName);
    const safeEmail = escapeHTML(recipient);
    const safeMessage = escapeHTML(cleanMessage).replace(/\n/g, "<br>");

    const submittedAt = new Date().toLocaleString("en-IN", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    });

    // 1. ADMIN NOTIFICATION

    const adminHTML = emailLayout(`
        <div style="display:inline-block;padding:7px 12px;background:#26351F;color:${CIVIX.lime};font-size:11px;font-weight:bold;letter-spacing:1px;">
            NEW CONTACT REQUEST
        </div>

        <h1 style="margin:24px 0 12px;font-size:27px;color:${CIVIX.ivory};">
            Someone wants to connect.
        </h1>

        <p style="font-size:15px;line-height:1.7;color:${CIVIX.muted};">
            A new message has arrived through the CIVIX contact form.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0"
        style="margin-top:22px;background:${CIVIX.midnight};border:1px solid #26332D;border-radius:9px;">

        <tr>
        <td style="padding:17px;border-bottom:1px solid #26332D;">
            <div style="font-size:11px;color:${CIVIX.muted};">NAME</div>
            <div style="margin-top:7px;font-size:16px;color:${CIVIX.ivory};">${safeName}</div>
        </td>
        </tr>

        <tr>
        <td style="padding:17px;border-bottom:1px solid #26332D;">
            <div style="font-size:11px;color:${CIVIX.muted};">EMAIL</div>
            <div style="margin-top:7px;font-size:15px;color:${CIVIX.lime};">${safeEmail}</div>
        </td>
        </tr>

        <tr>
        <td style="padding:17px;">
            <div style="font-size:11px;color:${CIVIX.muted};">MESSAGE</div>
            <div style="margin-top:12px;font-size:15px;line-height:1.8;color:${CIVIX.ivory};overflow-wrap:anywhere;">
                ${safeMessage}
            </div>
        </td>
        </tr>
        </table>

        <p style="margin-top:20px;font-size:12px;color:${CIVIX.muted};">
            Received: ${escapeHTML(submittedAt)}
        </p>
    `);

    const adminText = `
NEW CIVIX CONTACT REQUEST

Name: ${cleanName}
Email: ${recipient}

Message:
${cleanMessage}

Received: ${submittedAt}
`;

    const adminResult = await transporter.sendMail({
        from: `"CIVIX Contact" <${EMAIL_USER}>`,
        to: CONTACT_EMAIL,
        replyTo: recipient,
        subject: `CIVIX Contact — New message from ${cleanName}`,
        text: adminText,
        html: adminHTML,
    });

    // 2. VISITOR ACKNOWLEDGEMENT

    const userHTML = emailLayout(`
        <div style="display:inline-block;padding:7px 12px;background:#26351F;color:${CIVIX.lime};font-size:11px;font-weight:bold;letter-spacing:1px;">
            MESSAGE RECEIVED
        </div>

        <h1 style="margin:25px 0 12px;font-size:29px;color:${CIVIX.ivory};">
            Thank you, ${safeName}.
        </h1>

        <p style="font-size:16px;line-height:1.8;color:${CIVIX.muted};">
            Your voice matters to us. We have successfully received your
            message and appreciate you taking the time to reach out.
        </p>

        <div style="margin:25px 0;padding:20px;background:${CIVIX.midnight};border-left:3px solid ${CIVIX.lime};">
            <p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;color:${CIVIX.lime};">
                YOUR MESSAGE
            </p>
            <p style="margin:0;font-size:14px;line-height:1.8;color:${CIVIX.ivory};overflow-wrap:anywhere;">
                ${safeMessage}
            </p>
        </div>

        <p style="font-size:15px;line-height:1.8;color:${CIVIX.muted};">
            Our team will review your message and get back to you as soon as possible.
        </p>

        <p style="margin-top:28px;font-size:16px;font-weight:bold;color:${CIVIX.ivory};">
            Together, we make cities better.
        </p>

        <p style="font-size:14px;color:${CIVIX.lime};">
            — Team CIVIX
        </p>
    `);

    const userText = `
Hi ${cleanName},

Thank you for contacting CIVIX — The City That Listens.

We have successfully received your message:

"${cleanMessage}"

Our team will review it and get back to you as soon as possible.

Together, we make cities better.

Team CIVIX
`;

    let userEmailSent = false;
    let userEmailError = null;

    try {
        // Use the validated recipient, not the raw function argument.
        const userResult = await transporter.sendMail({
            from: `"CIVIX — The City That Listens" <${EMAIL_USER}>`,
            to: recipient,
            subject: "We've received your message | CIVIX",
            text: userText,
            html: userHTML,
        });

        userEmailSent = true;

    } catch (error) {
        userEmailError = error.message;
        console.error("[CIVIX] Visitor acknowledgement failed:", error.message);
    }

    return {
        adminEmailSent: true,
        userEmailSent,
        userEmailError,
        messageId: adminResult.messageId,
    };
};