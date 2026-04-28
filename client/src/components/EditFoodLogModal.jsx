import { useEffect, useMemo, useState } from 'react';
import Spinner from './Spinner';

const toNumber = (value) => Number(value);

const EditFoodLogModal = ({ open, log, saving, onClose, onSave }) => {
  const [form, setForm] = useState({ quantity: '' });
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!log) return;
    setForm({
      quantity: String(log.quantity ?? 1),
    });
    setTouched({});
  }, [log]);

  const errors = useMemo(() => {
    const next = {};
    if (!(toNumber(form.quantity) > 0)) next.quantity = 'Quantity must be greater than zero.';
    return next;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  if (!open || !log) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ quantity: true });
    if (!isValid || saving) return;

    onSave({
      quantity: Number(form.quantity),
    });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Edit food log">
      <div className="modal-box">
        <div className="modal-header">
          <h2>Edit Food Log</h2>
          <button type="button" className="modal-close" onClick={onClose} disabled={saving} aria-label="Close">×</button>
        </div>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: '1rem' }}>{log.foodName}</p>

        <form className="page-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="edit-quantity">Quantity</label>
            <input
              id="edit-quantity"
              name="quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={form.quantity}
              onChange={handleChange}
              className={touched.quantity && errors.quantity ? 'input-error' : ''}
            />
            {touched.quantity && errors.quantity && <small className="field-error">{errors.quantity}</small>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!isValid || saving}>
              {saving ? <><Spinner size="sm" /> Updating…</> : 'Update Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFoodLogModal;
