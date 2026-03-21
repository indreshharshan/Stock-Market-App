"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAlert } from "@/lib/actions/alert.actions";
import AlertModal from "@/components/AlertModal";
import { formatPrice, getAlertText } from "@/lib/utils";

export default function AlertsList({ alertData }: AlertsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (alertId: string) => {
    setDeletingId(alertId);
    startTransition(async () => {
      try {
        await deleteAlert(alertId);
        router.refresh();
      } catch (err) {
        console.error("Failed to delete alert:", err);
      } finally {
        setDeletingId(null);
      }
    });
  };

  const handleEdit = (alert: Alert) => {
    setSelectedAlert(alert);
    setEditModalOpen(true);
  };

  return (
    <>
      <div className="alert-list">
        {!alertData || alertData.length === 0 ? (
          <div className="alert-empty">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.2}
              stroke="currentColor"
              className="h-10 w-10 mx-auto mb-3 text-gray-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
            <p className="text-sm text-gray-600">No alerts set yet</p>
            <p className="text-xs text-gray-700 mt-1">
              Add an alert from a stock in your watchlist
            </p>
          </div>
        ) : (
          alertData.map((alert) => {
            const isUpperAlert = alert.alertType === "upper";
            const isDeleting = deletingId === alert.id && isPending;

            return (
              <div key={alert.id} className="alert-item">
                {/* Alert Name + type badge */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="alert-name text-base leading-snug">
                    {alert.alertName}
                  </h3>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded font-semibold ${
                      isUpperAlert
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {isUpperAlert ? "▲ Upper" : "▼ Lower"}
                  </span>
                </div>

                {/* Stock info + price details */}
                <div className="alert-details">
                  <div>
                    <p className="alert-company text-sm">
                      <span className="font-mono text-yellow-400 font-semibold">
                        {alert.symbol}
                      </span>{" "}
                      · {alert.company}
                    </p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Threshold:{" "}
                      <span className="font-semibold text-gray-200">
                        {formatPrice(alert.threshold)}
                      </span>
                    </p>
                  </div>
                  {alert.currentPrice > 0 && (
                    <div className="text-right">
                      <p className="alert-price text-sm">
                        {formatPrice(alert.currentPrice)}
                      </p>
                      {typeof alert.changePercent === "number" && (
                        <p
                          className={`text-xs font-medium ${
                            alert.changePercent >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {alert.changePercent >= 0 ? "+" : ""}
                          {alert.changePercent.toFixed(2)}%
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Condition line */}
                <p className="text-xs text-gray-500 mb-3 font-mono">
                  {getAlertText(alert)}
                </p>

                {/* Actions */}
                <div className="alert-actions">
                  <button
                    className="alert-update-btn p-1.5 rounded-full transition-colors"
                    title="Edit alert"
                    onClick={() => handleEdit(alert)}
                    disabled={isPending}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                      />
                    </svg>
                  </button>

                  <button
                    className="alert-delete-btn p-1.5 rounded-full transition-colors"
                    title="Delete alert"
                    onClick={() => handleDelete(alert.id)}
                    disabled={isDeleting || isPending}
                  >
                    {isDeleting ? (
                      <svg
                        className="animate-spin h-4 w-4 text-gray-400"
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
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {selectedAlert && (
        <AlertModal
          alertId={selectedAlert.id}
          alertData={{
            symbol: selectedAlert.symbol,
            company: selectedAlert.company,
            alertName: selectedAlert.alertName,
            alertType: selectedAlert.alertType,
            threshold: String(selectedAlert.threshold),
          }}
          action="edit"
          open={editModalOpen}
          setOpen={setEditModalOpen}
        />
      )}
    </>
  );
}
