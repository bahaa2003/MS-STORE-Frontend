import React, { useEffect, useState } from 'react';
import { Boxes, ClipboardList, Target } from 'lucide-react';
import AdminOrdersTable from '../../components/target/AdminOrdersTable';
import AdminProducts from '../../components/target/AdminProducts';
import RejectionReasonModal from '../../components/target/RejectionReasonModal';
import useTargetStore from '../../store/useTargetStore';
import useAuthStore from '../../store/useAuthStore';
import { useToast } from '../../components/ui/Toast';
import { formatNumber } from '../../utils/intl';
import { PERMISSIONS, hasPermission } from '../../utils/permissions';

const AdminTargetRequests = () => {
  const {
    products,
    requests,
    paymentMethods,
    addProduct,
    updateProduct,
    deleteProduct,
    loadApps,
    loadRequests,
    updateRequestStatus,
  } = useTargetStore();
  const { user: actor } = useAuthStore();
  const { addToast } = useToast();
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const canConfirmTargetRequests = hasPermission(actor, PERMISSIONS.CONFIRM_TARGET_REQUESTS);

  useEffect(() => {
    void loadApps({ includeInactive: true });
    void loadRequests({ page: 1, limit: 100 });
  }, [loadApps, loadRequests]);

  const handleAddProduct = async (payload) => {
    await addProduct(payload);
    addToast('Target app created successfully.', 'success');
  };

  const handleUpdateProduct = async (id, payload) => {
    await updateProduct(id, payload);
    addToast('Target app updated successfully.', 'success');
  };

  const handleDeleteProduct = async (id) => {
    await deleteProduct(id);
    addToast('Target app deactivated.', 'success');
  };

  const handleStatusChange = async (id, status) => {
    if (!canConfirmTargetRequests) {
      addToast('You do not have permission to review target orders.', 'error');
      return;
    }

    if (String(status).toUpperCase() === 'REJECTED') {
      setRejectingRequest(requests.find((request) => String(request.id) === String(id)) || { id });
      return;
    }

    await updateRequestStatus(id, status, { rejectionReason: '' });
    addToast('Target order status updated.', 'success');
  };

  const handleConfirmReject = async (reason) => {
    if (!rejectingRequest?.id) return;
    await updateRequestStatus(rejectingRequest.id, 'REJECTED', { adminNotes: reason, rejectionReason: reason });
    setRejectingRequest(null);
    addToast('Target order rejected.', 'success');
  };

  const pendingCount = requests.filter((request) => String(request.status).toUpperCase() === 'PENDING').length;
  const completedCount = requests.filter((request) => String(request.status).toUpperCase() === 'APPROVED').length;

  return (
    <div className="min-w-0 space-y-6 text-[var(--color-text)]">
      <section className="overflow-hidden rounded-[2rem] border border-[color:rgb(var(--color-primary-rgb)/0.22)] bg-[radial-gradient(34rem_circle_at_top_right,rgb(var(--color-primary-rgb)/0.14),transparent_44%),linear-gradient(135deg,rgb(var(--color-card-rgb)/0.98),rgb(var(--color-surface-rgb)/0.92))] p-5 shadow-[0_28px_80px_-54px_rgb(var(--color-primary-rgb)/0.42)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:rgb(var(--color-primary-rgb)/0.26)] bg-[color:rgb(var(--color-primary-rgb)/0.1)] text-[var(--color-primary)]">
              <Target className="h-7 w-7" />
            </span>
            <h1 className="text-2xl font-black text-[var(--color-text)] sm:text-4xl">Target Apps & Orders</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
              Manage dynamic target apps and review customer target purchase orders from the backend.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[32rem]">
            <div className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-elevated-rgb)/0.72)] p-4 shadow-[var(--shadow-subtle)]">
              <Boxes className="h-5 w-5 text-[var(--color-primary)]" />
              <p className="mt-2 text-2xl font-black text-[var(--color-text)]">{formatNumber(products.length, 'en-US')}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Apps</p>
            </div>
            <div className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-elevated-rgb)/0.72)] p-4 shadow-[var(--shadow-subtle)]">
              <ClipboardList className="h-5 w-5 text-[var(--color-primary)]" />
              <p className="mt-2 text-2xl font-black text-[var(--color-text)]">{formatNumber(pendingCount, 'en-US')}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Pending</p>
            </div>
            <div className="rounded-2xl border border-[color:rgb(var(--color-border-rgb)/0.82)] bg-[color:rgb(var(--color-elevated-rgb)/0.72)] p-4 shadow-[var(--shadow-subtle)]">
              <Target className="h-5 w-5 text-[var(--color-primary)]" />
              <p className="mt-2 text-2xl font-black text-[var(--color-text)]">{formatNumber(completedCount, 'en-US')}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Approved</p>
            </div>
          </div>
        </div>
      </section>

      <AdminProducts
        products={products}
        paymentMethods={paymentMethods}
        onAdd={handleAddProduct}
        onUpdate={handleUpdateProduct}
        onDelete={handleDeleteProduct}
      />

      <AdminOrdersTable requests={requests} onStatusChange={handleStatusChange} canConfirm={canConfirmTargetRequests} />

      <RejectionReasonModal
        isOpen={Boolean(rejectingRequest)}
        onClose={() => setRejectingRequest(null)}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
};

export default AdminTargetRequests;
