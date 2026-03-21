import Link from 'next/link';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import SearchCommand from '@/components/SearchCommand';
import WatchlistButton from '@/components/WatchlistButton';
import AlertsList from '@/components/AlertsList';
import AlertModal from '@/components/AlertModal';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import { getAlertsByUser } from '@/lib/actions/alert.actions';
import { getQuotes } from '@/lib/actions/finnhub.actions';
import WatchlistDashboard from '@/components/WatchlistDashboard';

async function getWatchlistWithQuotes(userId: string): Promise<StockWithData[]> {
  try {
    await connectToDatabase();
    const items = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();
    if (!items.length) return [];

    const symbols = items.map((i) => i.symbol);
    const quotes = await getQuotes(symbols);

    return items.map((item) => {
      const q = quotes[item.symbol.toUpperCase()];
      return {
        userId: item.userId,
        symbol: item.symbol,
        company: item.company,
        addedAt: item.addedAt,
        currentPrice: q?.current ?? 0,
        changePercent: q?.percentChange ?? 0,
      };
    });
  } catch (err) {
    console.error('Error fetching watchlist:', err);
    return [];
  }
}

export default async function WatchlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  const userId = session.user.id;

  const [watchlist, alerts, initialSearchStocks] = await Promise.all([
    getWatchlistWithQuotes(userId),
    getAlertsByUser(),
    searchStocks(),
  ]);

  return (
    <div className="container py-8 md:py-12">
      <WatchlistDashboard 
        initialWatchlist={watchlist}
        initialAlerts={alerts}
        initialSearchStocks={initialSearchStocks}
      />
    </div>
  );
}
