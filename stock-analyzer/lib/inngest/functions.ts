import { inngest } from "@/lib/inngest/client";
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "./prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";

interface UserForNewsEmail {
    id: string;
    email: string;
    name: string;
}

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

export const sendDailyNewsSummary = inngest.createFunction(
    {
        id: "daily-news-summary",
        triggers: [
            {
                event: "app/send.daily.news",
            },
            {
                cron: "0 12 * * *",
            },
        ],
    },
    async ({ step }) => {
        const users = await step.run(
            "get-all-users",
            getAllUsersForNewsEmail
        );

        if (!users || users.length === 0) {
            return {
                success: false,
                message: "No users found for news email",
            };
        }

        const results = await step.run("fetch-user-news", async () => {
            const perUser: Array<{
                user: UserForNewsEmail;
                articles: MarketNewsArticle[];
            }> = [];

            for (const user of users as UserForNewsEmail[]) {
                try {
                    const symbols =
                        await getWatchlistSymbolsByEmail(user.email);

                    let articles = await getNews(symbols);

                    articles = (articles || []).slice(0, 6);

                    if (articles.length === 0) {
                        articles = await getNews();
                        articles = (articles || []).slice(0, 6);
                    }

                    perUser.push({
                        user,
                        articles,
                    });
                } catch (error) {
                    console.error(
                        "daily-news: error preparing user news",
                        user.email,
                        error
                    );

                    perUser.push({
                        user,
                        articles: [],
                    });
                }
            }

            return perUser;
        });

        const userNewsSummaries: {
            user: UserForNewsEmail;
            newsContent: string | null;
        }[] = [];

        for (const { user, articles } of results) {
            try {
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
                    "{{newsData}}",
                    JSON.stringify(articles, null, 2)
                );

                const response = await step.ai.infer(
                    `summarize-news-${user.id}`,
                    {
                        model: step.ai.models.gemini({
                            model: "gemini-2.5-flash",
                        }),
                        body: {
                            contents: [
                                {
                                    role: "user",
                                    parts: [{ text: prompt }],
                                },
                            ],
                        },
                    }
                );

                const part =
                    response.candidates?.[0]?.content?.parts?.[0];

                const newsContent =
                    part && "text" in part
                        ? part.text
                        : "No market news.";

                userNewsSummaries.push({
                    user,
                    newsContent,
                });
            } catch (error) {
                console.error(
                    "Failed to summarize news for:",
                    user.email,
                    error
                );

                userNewsSummaries.push({
                    user,
                    newsContent: null,
                });
            }
        }

        await step.run("send-news-emails", async () => {
            return Promise.all(
                userNewsSummaries.map(
                    async ({ user, newsContent }) => {
                        if (!newsContent) return false;

                        return sendNewsSummaryEmail({
                            email: user.email,
                            date: getFormattedTodayDate(),
                            newsContent,
                        });
                    }
                )
            );
        });

        return {
            success: true,
            message:
                "Daily news summary emails sent successfully",
        };
    }
);