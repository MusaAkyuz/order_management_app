"use client";

import type { PaginationMeta } from "@/types/api";

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const { current, total, count, limit } = pagination;

  if (count === 0) return null;

  const rangeStart = (current - 1) * limit + 1;
  const rangeEnd = Math.min(current * limit, count);

  // Gösterilecek sayfa numaralarını hesapla (mevcut sayfanın etrafında en fazla 5 sayfa)
  const pageNumbers: number[] = [];
  const windowSize = 2;
  const start = Math.max(1, current - windowSize);
  const end = Math.min(total, current + windowSize);
  for (let p = start; p <= end; p++) pageNumbers.push(p);

  return (
    <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>
          {count > 0 ? `${rangeStart}-${rangeEnd}` : 0} / {count} kayıt
        </span>
        {onLimitChange && (
          <label className="flex items-center gap-2">
            Sayfa başına:
            <select
              value={limit}
              onChange={(e) => onLimitChange(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md text-sm py-1 px-2 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {total > 1 && (
        <nav className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(current - 1)}
            disabled={current <= 1}
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Önceki
          </button>

          {start > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                1
              </button>
              {start > 2 && <span className="px-1 text-gray-400">…</span>}
            </>
          )}

          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md border ${
                p === current
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}

          {end < total && (
            <>
              {end < total - 1 && <span className="px-1 text-gray-400">…</span>}
              <button
                onClick={() => onPageChange(total)}
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                {total}
              </button>
            </>
          )}

          <button
            onClick={() => onPageChange(current + 1)}
            disabled={current >= total}
            className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sonraki
          </button>
        </nav>
      )}
    </div>
  );
}
