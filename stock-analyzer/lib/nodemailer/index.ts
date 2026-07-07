import nodemailer from "nodemailer";
import { WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE } from "./templates";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
    },
});

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro)
    const mailOptions = {
        from: '"Signalist" <stockanalyst@signalist.com>',
        to: email,
        subject: "Welcome to Signalist - your stock market toolkit is ready",
        text: 'Thanks for joining Signalist',
        html: htmlTemplate,

    }
    await transporter.sendMail(mailOptions)
}

/** Tags explicitly allowed in AI-generated news content. */
const ALLOWED_TAGS = new Set([
    'h3', 'h4', 'p', 'div', 'ul', 'ol', 'li', 'strong', 'em', 'span', 'a',
    'br', 'hr',
]);

/**
 * Strip any HTML element whose tag name is not in ALLOWED_TAGS.
 * Attributes are preserved as-is for allowed tags (email clients need inline
 * styles); the goal is to remove unexpected structural or scripting tags.
 */
function sanitizeNewsContent(raw: string): string {
    return raw.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag: string) => {
        return ALLOWED_TAGS.has(tag.toLowerCase()) ? match : '';
    });
}

export const sendNewsSummaryEmail = async ({ email, date, newsContent }: NewsSummaryEmailData) => {
    const safeContent = sanitizeNewsContent(newsContent);

    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', safeContent);

    const mailOptions = {
        from: '"Signalist News" <stockanalyst@signalist.com>',
        to: email,
        subject: `Market news Summary today- ${date}`,
        text: "Today's market news summary from signalist",
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
}