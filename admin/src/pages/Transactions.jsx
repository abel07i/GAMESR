import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { 
  ArrowUpRight, 
  Trash2, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle 
} from "lucide-react";

export default function Transactions() {
  const [data, setData] = useState({ transactions: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "", search: "", page: 1 });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [toast, setToast] = useState(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    isBulk: false,
    item: null, // single tx or null for bulk
    submitting: false,
    error: null
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTx = () => {
    setLoading(true);
    api.getTransactions(filters)
      .then(res => {
        setData(res || { transactions: [], total: 0 });
        setSelectedIds(new Set()); // Reset selections on page change or refresh
      })
      .catch(err => {
        console.error("Failed to fetch transactions:", err);
        showToast("error", err.message || "Failed to load transactions");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTx();
  }, [filters.page, filters.type, filters.search]);

  const getTxColor = (type) => {
    if (['DEPOSIT', 'WIN', 'PAYOUT_WIN', 'REFUND'].includes(type)) return 'var(--success)';
    if (['WITHDRAWAL', 'WAGER', 'TICKET_BUY'].includes(type)) return 'var(--danger)';
    return 'var(--text-primary)';
  };

  // ─── Selection Logic ────────────────────────────────────────────────────────
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === data.transactions.length && data.transactions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.transactions.map(t => t.id)));
    }
  };

  // ─── Delete Modal Handlers ──────────────────────────────────────────────────
  const openSingleDelete = (tx) => {
    setDeleteModal({
      open: true,
      isBulk: false,
      item: tx,
      submitting: false,
      error: null
    });
  };

  const openBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteModal({
      open: true,
      isBulk: true,
      item: null,
      submitting: false,
      error: null
    });
  };

  const closeDeleteModal = () => {
    if (deleteModal.submitting) return;
    setDeleteModal({ open: false, isBulk: false, item: null, submitting: false, error: null });
  };

  const confirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, submitting: true, error: null }));
    try {
      if (deleteModal.isBulk) {
        const ids = Array.from(selectedIds);
        const res = await api.bulkDeleteTransactions(ids);
        showToast("success", `Successfully deleted ${res.deletedCount || ids.length} transaction(s).`);
      } else if (deleteModal.item) {
        await api.deleteTransaction(deleteModal.item.id);
        showToast("success", "Transaction deleted successfully.");
      }
      closeDeleteModal();
      fetchTx();
    } catch (err) {
      setDeleteModal(prev => ({ ...prev, submitting: false, error: err.message || "Failed to delete transaction" }));
    }
  };

  return (
    <div>
      {/* Toast alert */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
            {toast.type === "success" ? <CheckCircle className="text-success" size={20} /> : <AlertTriangle className="text-danger" size={20} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-between mb-6">
        <div>
          <h1 className="page-title">Transaction Ledger</h1>
          <p className="text-muted">Audit, search, and manage financial transactions and player ledger records.</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchTx} disabled={loading} title="Refresh transactions">
          <RefreshCw size={16} className={loading ? "spinner" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {/* Controls / Filter row */}
          <div className="filter-row mb-4">
            <div className="flex gap-2" style={{ flexWrap: "wrap", flex: 1 }}>
              <select
                className="form-select"
                style={{ width: "auto" }}
                value={filters.type}
                onChange={e => setFilters({ ...filters, type: e.target.value, page: 1 })}
              >
                <option value="">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="ticket_buy">Ticket Buy / Wager</option>
                <option value="payout_win">Payout Win</option>
                <option value="refund">Refund</option>
              </select>

              <div className="search-input-wrapper" style={{ flex: 1, maxWidth: 360 }}>
                <Search size={18} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search player, phone, or note..."
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar when 1+ selected */}
          {selectedIds.size > 0 && (
            <div 
              className="flex-between mb-4 p-3 rounded-lg"
              style={{ 
                background: "rgba(234, 161, 27, 0.12)", 
                border: "1px solid rgba(234, 161, 27, 0.35)",
                flexWrap: "wrap",
                gap: "10px"
              }}
            >
              <div className="flex-center gap-2">
                <span className="badge badge-warning" style={{ fontSize: 13, padding: "4px 10px" }}>
                  {selectedIds.size} Selected
                </span>
                <span className="text-muted text-xs">
                  of {data.transactions.length} displayed records
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  className="btn btn-sm flex-center gap-1"
                  style={{ background: "rgba(239, 68, 68, 0.2)", color: "var(--danger)", border: "1px solid var(--danger)" }}
                  onClick={openBulkDelete}
                  title="Bulk delete selected transaction records"
                >
                  <Trash2 size={14} />
                  <span>Bulk Delete ({selectedIds.size})</span>
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="loading-overlay"><div className="spinner"></div></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={data.transactions.length > 0 && selectedIds.size === data.transactions.length}
                        onChange={handleToggleSelectAll}
                        title="Select/Deselect all visible transactions"
                        style={{ cursor: "pointer", width: 16, height: 16 }}
                      />
                    </th>
                    <th>Time</th>
                    <th>ID</th>
                    <th>Player</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Post Balance</th>
                    <th>Reference / Details</th>
                    <th style={{ width: 60, textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.length === 0 ? (
                    <tr><td colSpan="9" className="text-center text-muted py-8">No transactions found.</td></tr>
                  ) : data.transactions.map(tx => {
                    const isSelected = selectedIds.has(tx.id);
                    const txType = (tx.tx_type || "").toUpperCase();

                    return (
                      <tr key={tx.id} style={{ background: isSelected ? "rgba(234, 161, 27, 0.05)" : undefined }}>
                        {/* Checkbox */}
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(tx.id)}
                            style={{ cursor: "pointer", width: 16, height: 16 }}
                          />
                        </td>

                        {/* Date & Time */}
                        <td className="text-sm text-muted">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>

                        {/* ID */}
                        <td className="text-sm font-mono text-muted" title={tx.id}>
                          {tx.id.substring(0, 8)}...
                        </td>

                        {/* Player */}
                        <td>
                          {tx.user_id ? (
                            <Link to={`/players/${tx.user_id}`} className="hover:underline font-medium text-primary">
                              {tx.player_name || "Unknown"}
                            </Link>
                          ) : (
                            <span className="text-muted">{tx.player_name || "System"}</span>
                          )}
                        </td>

                        {/* Type */}
                        <td>
                          <span 
                            className="badge badge-muted" 
                            style={{ 
                              border: `1px solid ${getTxColor(txType)}`, 
                              color: getTxColor(txType) 
                            }}
                          >
                            {txType}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="font-bold" style={{ color: getTxColor(txType) }}>
                          {tx.direction > 0 ? '+' : '-'}{parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                        </td>

                        {/* Post Balance */}
                        <td className="font-medium font-mono text-sm">
                          {parseFloat(tx.running_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                        </td>

                        {/* Details */}
                        <td>
                          <div className="flex items-center gap-2">
                            {tx.reference_note && <span className="text-muted text-sm">{tx.reference_note}</span>}
                            {tx.room_id && (
                              <Link to={`/games/${tx.room_id}`} className="text-accent hover:underline text-sm flex items-center gap-1">
                                View Game <ArrowUpRight size={14} />
                              </Link>
                            )}
                          </div>
                        </td>

                        {/* Single Delete Button */}
                        <td style={{ textAlign: "center" }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: "var(--danger)", padding: "4px 8px" }}
                            onClick={() => openSingleDelete(tx)}
                            title="Delete transaction record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Showing {Math.min((filters.page - 1) * 20 + 1, data.total)} to {Math.min(filters.page * 20, data.total)} of {data.total} transactions
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                ←
              </button>
              <span className="text-sm font-medium px-2">Page {filters.page}</span>
              <button
                className="page-btn"
                disabled={filters.page * 20 >= data.total}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal (Single or Bulk) */}
      {deleteModal.open && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex-center gap-2">
                <Trash2 className="text-danger" size={20} />
                <h3 className="modal-title">
                  {deleteModal.isBulk ? `Bulk Delete (${selectedIds.size} Transactions)` : "Delete Transaction Record"}
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={closeDeleteModal} disabled={deleteModal.submitting}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {deleteModal.error && (
                <div className="p-3 mb-4 rounded" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid var(--danger)", color: "var(--danger)", fontSize: 13 }}>
                  {deleteModal.error}
                </div>
              )}

              {deleteModal.isBulk ? (
                <p className="text-secondary text-sm">
                  Are you sure you want to permanently delete the <strong>{selectedIds.size}</strong> selected transaction records?
                  <br />
                  <span className="text-warning text-xs mt-2 block">
                    ⚠️ This action is irreversible and will remove these entries from the transaction ledger.
                  </span>
                </p>
              ) : (
                <p className="text-secondary text-sm">
                  Are you sure you want to delete transaction <strong className="text-white font-mono">{deleteModal.item?.id?.substring(0, 8)}...</strong> (
                  <span className="font-bold text-warning">{parseFloat(deleteModal.item?.amount || 0).toLocaleString()} ETB</span>)?
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={closeDeleteModal} disabled={deleteModal.submitting}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleteModal.submitting}
              >
                {deleteModal.submitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
