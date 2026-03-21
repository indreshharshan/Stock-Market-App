"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const label = useMemo(() => {
    if (isPending) return type === "icon" ? "" : added ? "Removing..." : "Adding...";
    if (type === "icon") return added ? "★" : "☆";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type, isPending]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const next = !added;
    setAdded(next); // optimistic UI update

    startTransition(async () => {
      try {
        if (next) {
          const result = await addToWatchlist(symbol, company);
          if (!result.success) {
            // Revert optimistic update on failure
            setAdded(!next);
            console.error("Failed to add to watchlist:", result.error);
            return;
          }
        } else {
          const result = await removeFromWatchlist(symbol);
          if (!result.success) {
            // Revert optimistic update on failure
            setAdded(!next);
            console.error("Failed to remove from watchlist:", result.error);
            return;
          }
        }
        onWatchlistChange?.(symbol, next);
        router.refresh(); // refresh the page to reflect the new server state
      } catch (err) {
        // Revert on unexpected error
        setAdded(!next);
        console.error("Watchlist action error:", err);
      }
    });
  };

  if (type === "icon") {
    return (
      <button
        title={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        aria-label={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""}`}
        onClick={handleClick}
        disabled={isPending}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={added ? "#FACC15" : "none"}
          stroke="#FACC15"
          strokeWidth="1.5"
          className={`watchlist-star ${isPending ? "opacity-50" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      className={`watchlist-btn ${added ? "watchlist-remove" : ""} ${isPending ? "opacity-70 cursor-wait" : ""}`}
      onClick={handleClick}
      disabled={isPending}
    >
      {showTrashIcon && added && !isPending ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 mr-2 inline-block"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6" />
        </svg>
      ) : null}
      {isPending ? (
        <svg
          className="inline-block w-4 h-4 mr-2 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      <span>{label}</span>
    </button>
  );
};

export default WatchlistButton;
