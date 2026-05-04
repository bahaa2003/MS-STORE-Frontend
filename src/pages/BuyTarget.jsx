import React, { useEffect } from 'react';
import TargetForm from '../components/target/TargetForm';
import useTargetStore from '../store/useTargetStore';
import { useToast } from '../components/ui/Toast';

const BuyTarget = () => {
  const { products, loadApps, submitRequest } = useTargetStore();
  const { addToast } = useToast();

  useEffect(() => {
    void loadApps({ includeInactive: false });
  }, [loadApps]);

  const handleSubmit = async (payload) => {
    await submitRequest(payload);
    addToast('Target order submitted successfully.', 'success');
  };

  return (
    <div className="mx-auto max-w-6xl text-[var(--color-text)]">
      <TargetForm products={products} onSubmit={handleSubmit} />
    </div>
  );
};

export default BuyTarget;
