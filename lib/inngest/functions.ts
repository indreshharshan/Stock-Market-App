import {inngest} from "@/lib/inngest/client";
import {NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT} from "@/lib/inngest/prompts";
import {sendNewsSummaryEmail, sendPriceAlertEmail, sendWelcomeEmail} from "@/lib/nodemailer";
import {getAllUsersForNewsEmail} from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import { connectToDatabase } from "@/database/mongoose";
import { AlertModel } from "@/database/models/alert.model";
import { formatPrice } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchQuote(symbol: string): Promise<number | null> {
    const token = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) return null;
    try {
        const res = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`,
            { cache: 'no-store' }
        );
        if (!res.ok) return null;
        const data = await res.json() as { c?: number };
        return typeof data?.c === 'number' && data.c > 0 ? data.c : null;
    } catch {
        return null;
    }
}

// ─── User type ────────────────────────────────────────────────────────────────

type UserForNewsEmail = {
    id: string;
    email: string;
    name: string;
};

// ─── Welcome email on sign-up ─────────────────────────────────────────────────

export const sendSignUpEmail = inngest.createFunction(
    { id: 'sign-up-email' },
    { event: 'app/user.created'},
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile)

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
            body: {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt }
                        ]
                    }]
            }
        })

        await step.run('send-welcome-email', async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null) ||'Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.'

            const { data: { email, name } } = event;

            return await sendWelcomeEmail({ email, name, intro: introText });
        })

        return {
            success: true,
            message: 'Welcome email sent successfully'
        }
    }
)

// ─── Daily news summary ───────────────────────────────────────────────────────

export const sendDailyNewsSummary = inngest.createFunction(
    { id: 'daily-news-summary' },
    [ { event: 'app/send.daily.news' }, { cron: '0 12 * * *' } ],
    async ({ step }) => {
        // Step #1: Get all users for news delivery
        const users = await step.run('get-all-users', getAllUsersForNewsEmail)

        if(!users || users.length === 0) return { success: false, message: 'No users found for news email' };

        // Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
        const results = await step.run('fetch-user-news', async () => {
            const perUser: Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }> = [];
            for (const user of users as UserForNewsEmail[]) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols);
                    // Enforce max 6 articles per user
                    articles = (articles || []).slice(0, 6);
                    // If still empty, fallback to general
                    if (!articles || articles.length === 0) {
                        articles = await getNews();
                        articles = (articles || []).slice(0, 6);
                    }
                    perUser.push({ user, articles });
                } catch (e) {
                    console.error('daily-news: error preparing user news', user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }
            return perUser;
        });

        // Step #3: Summarize news via AI
        const userNewsSummaries: { user: UserForNewsEmail; newsContent: string | null }[] = [];

        for (const { user, articles } of results) {
                try {
                    const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles, null, 2));

                    const response = await step.ai.infer(`summarize-news-${user.email}`, {
                        model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
                        body: {
                            contents: [{ role: 'user', parts: [{ text:prompt }]}]
                        }
                    });

                    const part = response.candidates?.[0]?.content?.parts?.[0];
                    const newsContent = (part && 'text' in part ? part.text : null) || 'No market news.'

                    userNewsSummaries.push({ user, newsContent });
                } catch (e) {
                    console.error('Failed to summarize news for : ', user.email);
                    userNewsSummaries.push({ user, newsContent: null });
                }
            }

        // Step #4: Send the emails
        await step.run('send-news-emails', async () => {
                await Promise.all(
                    userNewsSummaries.map(async ({ user, newsContent}) => {
                        if(!newsContent) return false;

                        return await sendNewsSummaryEmail({ email: user.email, date: getFormattedTodayDate(), newsContent })
                    })
                )
            })

        return { success: true, message: 'Daily news summary emails sent successfully' }
    }
)

// ─── Price alert checker — runs every 15 minutes ──────────────────────────────

export const checkPriceAlerts = inngest.createFunction(
    { id: 'check-price-alerts' },
    [{ event: 'app/check.price.alerts' }, { cron: '*/15 * * * *' }],
    async ({ step }) => {
        // Step 1: Load all un-triggered alerts from DB
        const alerts = await step.run('load-alerts', async () => {
            await connectToDatabase();
            const items = await AlertModel.find({ triggered: false }).lean();
            return items.map((a) => ({
                id: String(a._id),
                userId: a.userId,
                email: a.email,
                symbol: a.symbol,
                company: a.company,
                alertName: a.alertName,
                alertType: a.alertType as 'upper' | 'lower',
                threshold: a.threshold,
            }));
        });

        if (!alerts || alerts.length === 0) {
            return { success: true, message: 'No active alerts to check' };
        }

        // Step 2: Get unique symbols and fetch their current prices
        const uniqueSymbols = [...new Set(alerts.map((a) => a.symbol))];

        const prices = await step.run('fetch-prices', async () => {
            const result: Record<string, number | null> = {};
            await Promise.all(
                uniqueSymbols.map(async (sym) => {
                    result[sym] = await fetchQuote(sym);
                })
            );
            return result;
        });

        // Step 3: Check each alert and send emails for triggered ones
        await step.run('evaluate-and-notify', async () => {
            await connectToDatabase();

            const triggered: string[] = [];

            for (const alert of alerts) {
                const currentPrice = prices[alert.symbol];
                if (currentPrice === null || currentPrice === undefined) continue;

                const isTriggered =
                    (alert.alertType === 'upper' && currentPrice >= alert.threshold) ||
                    (alert.alertType === 'lower' && currentPrice <= alert.threshold);

                if (!isTriggered) continue;

                triggered.push(alert.id);

                try {
                    await sendPriceAlertEmail({
                        email: alert.email,
                        symbol: alert.symbol,
                        company: alert.company,
                        currentPrice: formatPrice(currentPrice),
                        targetPrice: formatPrice(alert.threshold),
                        alertType: alert.alertType,
                    });
                } catch (err) {
                    console.error('sendPriceAlertEmail error for', alert.symbol, err);
                }
            }

            // Mark triggered alerts so they don't fire again
            if (triggered.length > 0) {
                await AlertModel.updateMany(
                    { _id: { $in: triggered } },
                    { $set: { triggered: true } }
                );
            }

            return { checked: alerts.length, triggered: triggered.length };
        });

        return { success: true, message: `Processed ${alerts.length} alerts` };
    }
);
