// src/components/common/Pagination.jsx
import './Pagination.css';

/**
 * @param {{ page: number, limit: number, total: number, totalPages: number }} pagination
 * @param {(nextPage: number) => void} onPageChange
 */
export function Pagination({ pagination, onPageChange }) {
    if (!pagination || pagination.totalPages <= 1) return null;

    const { page, totalPages, total, limit } = pagination;
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    return (
        <nav className="pagination" aria-label="Pagination">
      <span className="pagination__summary">
        {start}–{end} of {total}
      </span>
            <div className="pagination__controls">
                <button
                    type="button"
                    className="pagination__button"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    Previous
                </button>
                <span className="pagination__page">
          Page {page} of {totalPages}
        </span>
                <button
                    type="button"
                    className="pagination__button"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </button>
            </div>
        </nav>
    );
}