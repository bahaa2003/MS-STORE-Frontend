import React from 'react';
import { Eye, ReceiptText } from 'lucide-react';
import Badge from '../ui/Badge';
import { selectClassName } from '../ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { formatDateTime, formatNumber } from '../../utils/intl';

const copyText = (value) => {
  const text = String(value || '').trim();
  if (!text || !navigator?.clipboard?.writeText) return;
  navigator.clipboard.writeText(text).catch(() => null);
};

const getStatusVariant = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'done' || value === 'approved') return 'success';
  if (value === 'rejected') return 'danger';
  return 'warning';
};

const getStatusLabel = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'done' || value === 'approved') return 'Approved';
  if (value === 'rejected') return 'Rejected';
  return 'Pending';
};

const AdminOrdersTable = ({ requests = [], onStatusChange, canConfirm = true }) => (
  <section className="space-y-4">
    <div>
      <h2 className="text-xl font-black text-[var(--color-text)]">Target Orders</h2>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Review transfer proof and approve or reject target orders.</p>
    </div>

    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>App</TableHead>
          <TableHead>Sender ID</TableHead>
          <TableHead>Coins</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Transfer Number</TableHead>
          <TableHead>Proof</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <div>
                <p className="font-bold text-[var(--color-text)]">{request.appNameSnapshot || request.productName}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{formatDateTime(request.createdAt, 'en-US')}</p>
              </div>
            </TableCell>
            <TableCell>
              <p className="font-semibold text-[var(--color-text)]">{request.senderId || request.transferFromId}</p>
            </TableCell>
            <TableCell>{formatNumber(request.coinAmount || request.quantity, 'en-US')}</TableCell>
            <TableCell className="font-bold text-[var(--color-primary)]">
              {formatNumber(request.totalPrice, 'en-US', { maximumFractionDigits: 2 })} EGP
            </TableCell>
            <TableCell>{request.paymentMethod || request.paymentMethodName}</TableCell>
            <TableCell>
              <button
                type="button"
                onClick={() => copyText(request.transferNumber || request.paymentAccount)}
                className="max-w-40 truncate rounded-lg border border-[color:rgb(var(--color-primary-rgb)/0.2)] px-2 py-1 text-xs font-bold text-[var(--color-primary)] transition hover:bg-[color:rgb(var(--color-primary-rgb)/0.08)]"
                title="Copy"
              >
                {request.transferNumber || request.paymentAccount || '-'}
              </button>
            </TableCell>
            <TableCell>
              {request.screenshotProof || request.proofImage ? (
                <a
                  href={request.screenshotProof || request.proofImage}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[color:rgb(var(--color-primary-rgb)/0.28)] px-3 py-1.5 text-xs font-bold text-[var(--color-primary)] transition hover:bg-[color:rgb(var(--color-primary-rgb)/0.08)]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                  <ReceiptText className="h-4 w-4" />
                  Missing
                </span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex min-w-36 items-center gap-2">
                <Badge variant={getStatusVariant(request.status)}>{getStatusLabel(request.status)}</Badge>
                <select
                  value={String(request.status || 'PENDING').toUpperCase()}
                  onChange={(event) => onStatusChange(request.id, event.target.value)}
                  className={cnStatusSelect}
                  disabled={!canConfirm}
                >
                  <option value="PENDING" disabled>Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              {String(request.status).toUpperCase() === 'REJECTED' && (request.rejectionReason || request.adminNotes) ? (
                <p className="mt-2 max-w-48 text-xs text-[var(--color-error)]">{request.rejectionReason || request.adminNotes}</p>
              ) : null}
            </TableCell>
          </TableRow>
        ))}

        {!requests.length && (
          <TableRow>
            <TableCell colSpan={8} className="py-10 text-center text-[var(--color-text-secondary)]">
              No target orders yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </section>
);

const cnStatusSelect = `${selectClassName} h-9 min-w-28 rounded-xl px-3 py-1.5 text-xs`;

export default AdminOrdersTable;
