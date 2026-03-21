'use server';

import { connectToDatabase } from '@/database/mongoose';
import { AlertModel } from '@/database/models/alert.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    return { id: session.user.id, email: session.user.email };
  } catch {
    return null;
  }
}

// ── Get all alerts for the logged-in user ──────────────────────────────────
export async function getAlertsByUser(): Promise<Alert[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    await connectToDatabase();
    const items = await AlertModel.find({ userId: user.id }).sort({ createdAt: -1 }).lean();

    return items.map((item) => ({
      id: String(item._id),
      userId: item.userId,
      symbol: item.symbol,
      company: item.company,
      alertName: item.alertName,
      alertType: item.alertType as 'upper' | 'lower',
      threshold: item.threshold,
      currentPrice: 0,        // will be enriched client-side via Finnhub
      changePercent: undefined,
    }));
  } catch (err) {
    console.error('getAlertsByUser error:', err);
    return [];
  }
}

// ── Create a new alert ─────────────────────────────────────────────────────
export async function createAlert(data: AlertData): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    await connectToDatabase();

    const alert = await AlertModel.create({
      userId: user.id,
      email: user.email,
      symbol: data.symbol.toUpperCase(),
      company: data.company,
      alertName: data.alertName,
      alertType: data.alertType,
      threshold: parseFloat(String(data.threshold)),
      triggered: false,
    });

    revalidatePath('/watchlist');
    return { success: true, id: String(alert._id) };
  } catch (err) {
    console.error('createAlert error:', err);
    return { success: false, error: 'Failed to create alert' };
  }
}

// ── Update an existing alert ───────────────────────────────────────────────
export async function updateAlert(
  alertId: string,
  data: AlertData
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    await connectToDatabase();

    await AlertModel.findOneAndUpdate(
      { _id: alertId, userId: user.id },
      {
        alertName: data.alertName,
        alertType: data.alertType,
        threshold: parseFloat(String(data.threshold)),
        triggered: false, // reset so it can fire again after update
      }
    );

    revalidatePath('/watchlist');
    return { success: true };
  } catch (err) {
    console.error('updateAlert error:', err);
    return { success: false, error: 'Failed to update alert' };
  }
}

// ── Delete an alert ────────────────────────────────────────────────────────
export async function deleteAlert(alertId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    await connectToDatabase();
    await AlertModel.deleteOne({ _id: alertId, userId: user.id });

    revalidatePath('/watchlist');
    return { success: true };
  } catch (err) {
    console.error('deleteAlert error:', err);
    return { success: false, error: 'Failed to delete alert' };
  }
}
