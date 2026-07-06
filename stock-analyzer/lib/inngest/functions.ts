import { inngest } from "@/lib/inngest/client";
import { PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./prompts";
import { success } from "better-auth";
import { sendWelcomeEmail } from "../nodemailer";
import { auth } from "../better-auth/auth";
import { headers } from "next/headers";

export const sendSignUpEmail = inngest.createFunction(
    {
        id: "send-signup-email",
        triggers: [
            {
                event: "app/user.created",
            },
        ],
    },
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk Tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `;

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
            "[USER_PROFILE]",
            userProfile
        )

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({ model: 'gemini-2.5-flash' }),
            body: {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt }
                        ]
                    }
                ]
            }
        })

        await step.run('send-welcom-email', async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null) || 'Thanks for Signalist you have tools to track markets and smarter moves'
            //EMAIL SENDING LOGIC
            const { data: { email, name } } = event;
            return await sendWelcomeEmail({ email, name, intro: introText })
        })

        return {
            success: true,
            message: "Welcome Email sent successfully"
        }
    }
);