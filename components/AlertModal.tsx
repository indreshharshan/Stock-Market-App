"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createAlert, updateAlert } from "@/lib/actions/alert.actions";
import { useRouter } from "next/navigation";
import { ALERT_TYPE_OPTIONS } from "@/lib/constants";

export default function AlertModal({
  alertId,
  alertData,
  action = "create",
  open,
  setOpen,
}: AlertModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [alertName, setAlertName] = useState(alertData?.alertName ?? "");
  const [alertType, setAlertType] = useState<"upper" | "lower">(
    alertData?.alertType ?? "upper"
  );
  const [threshold, setThreshold] = useState(
    alertData?.threshold ? String(alertData.threshold) : ""
  );

  // Reset when opened with new data
  useEffect(() => {
    setAlertName(alertData?.alertName ?? "");
    setAlertType(alertData?.alertType ?? "upper");
    setThreshold(alertData?.threshold ? String(alertData.threshold) : "");
    setError(null);
  }, [alertData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!alertName.trim()) return setError("Alert name is required.");
    if (!threshold || isNaN(parseFloat(threshold)) || parseFloat(threshold) <= 0)
      return setError("Enter a valid price threshold (must be > 0).");
    if (!alertData?.symbol || !alertData?.company)
      return setError("Stock symbol and company are required.");

    const payload: AlertData = {
      symbol: alertData.symbol,
      company: alertData.company,
      alertName: alertName.trim(),
      alertType,
      threshold,
    };

    startTransition(async () => {
      try {
        const result =
          action === "edit" && alertId
            ? await updateAlert(alertId, payload)
            : await createAlert(payload);

        if (!result.success) {
          setError(result.error ?? "Something went wrong.");
          return;
        }

        setOpen(false);
        router.refresh();
      } catch {
        setError("An unexpected error occurred.");
      }
    });
  };

  const isEdit = action === "edit";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="alert-dialog">
        <DialogHeader>
          <DialogTitle className="alert-title">
            {isEdit ? "Edit Alert" : "Create Price Alert"}
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            {isEdit
              ? `Edit your price alert for ${alertData?.symbol}`
              : `Get notified when ${alertData?.symbol ?? "the stock"} reaches your target price`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
          {/* Stock info pill */}
          {alertData?.symbol && (
            <div className="flex items-center gap-2 py-2 px-3 bg-gray-700 rounded-lg border border-gray-600">
              <span className="text-yellow-400 font-mono font-bold text-sm">
                {alertData.symbol}
              </span>
              <span className="text-gray-400 text-sm">{alertData.company}</span>
            </div>
          )}

          {/* Alert Name */}
          <div className="flex flex-col gap-1.5">
            <label className="form-label" htmlFor="alert-name">
              Alert Name
            </label>
            <input
              id="alert-name"
              type="text"
              placeholder="e.g. AAPL breakout watch"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              className="form-input rounded-lg px-3 py-2 text-white text-sm bg-gray-800 border border-gray-600 focus:border-yellow-500 focus:outline-none"
            />
          </div>

          {/* Alert Type */}
          <div className="flex flex-col gap-1.5">
            <label className="form-label">Alert Type</label>
            <div className="flex gap-3">
              {ALERT_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAlertType(opt.value as "upper" | "lower")}
                  className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                    alertType === opt.value
                      ? opt.value === "upper"
                        ? "border-green-500 bg-green-500/10 text-green-400"
                        : "border-red-500 bg-red-500/10 text-red-400"
                      : "border-gray-600 text-gray-400 hover:border-gray-400"
                  }`}
                >
                  {opt.value === "upper" ? "📈 " : "📉 "}
                  Price {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {alertType === "upper"
                ? "You'll be notified when price rises ABOVE your threshold."
                : "You'll be notified when price falls BELOW your threshold."}
            </p>
          </div>

          {/* Threshold */}
          <div className="flex flex-col gap-1.5">
            <label className="form-label" htmlFor="alert-threshold">
              Price Threshold (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                $
              </span>
              <input
                id="alert-threshold"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="form-input w-full rounded-lg pl-7 pr-3 py-2 text-white text-sm bg-gray-800 border border-gray-600 focus:border-yellow-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className={`yellow-btn w-full flex items-center justify-center gap-2 ${
              isPending ? "opacity-70 cursor-wait" : ""
            }`}
          >
            {isPending && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {isPending
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
              ? "Save Changes"
              : "Create Alert"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
