import React, { useState, useEffect, useRef } from 'react';
import type { OrderStatus } from '../types/index';

const STATUS_ORDER: OrderStatus[] = [
  'PENDING',
  'ACCEPTED',
  'PACKAGING',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
];

const STATUS_LABELS: Record<OrderStatus | string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  PACKAGING: 'Packaging',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
};

interface MyOrderSectionProps {
  initialOrderId?: string;
  onOrderFound?: (orderId: string) => void;
}

export const MyOrderSection: React.FC<MyOrderSectionProps> = ({
  initialOrderId = '',
  onOrderFound
}) => {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const activeOrderRef = useRef<string | null>(null);

  const normalizeStatus = (status: any): OrderStatus => {
    const value = String(status || 'PENDING')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_') as OrderStatus;

    if (!STATUS_ORDER.includes(value)) {
      return 'PENDING';
    }
    return value;
  };

  const loadOrder = async (searchId: string, silent = false) => {
    const cleanId = searchId.trim();
    if (!cleanId) {
      setMessage('Please enter your Order ID.');
      setOrder(null);
      return;
    }

    if (!silent) {
      setLoading(true);
      setMessage('Checking your order...');
    }

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(cleanId)}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('ORDER_NOT_FOUND');
        }
        throw new Error('SERVER_ERROR');
      }

      const data = await response.json();
      const resolvedOrder = data.orderId ? data : (data.data?.orderId ? data.data : data.data || data);

      if (!resolvedOrder || (!resolvedOrder.orderId && !resolvedOrder.id)) {
        throw new Error('INVALID_ORDER');
      }

      const formattedOrder = {
        orderId: resolvedOrder.orderId || resolvedOrder.id,
        customerName: resolvedOrder.customerName || 'Customer',
        total: resolvedOrder.total ?? resolvedOrder.grandTotal ?? 0,
        status: normalizeStatus(resolvedOrder.status)
      };

      setOrder(formattedOrder);
      setMessage('');
      activeOrderRef.current = formattedOrder.orderId;

      if (onOrderFound) {
        onOrderFound(formattedOrder.orderId);
      }
    } catch (error: any) {
      if (!silent) {
        setOrder(null);
        activeOrderRef.current = null;
        if (error.message === 'ORDER_NOT_FOUND') {
          setMessage('Order not found. Please check your Order ID.');
        } else {
          setMessage('Unable to check the order right now. Please try again.');
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadOrder(orderId);
  };

  useEffect(() => {
    if (initialOrderId) {
      setOrderId(initialOrderId);
      loadOrder(initialOrderId);
    }
  }, [initialOrderId]);

  // Live Auto-Refresh Polling every 4 seconds when an order is loaded
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeOrderRef.current) {
        loadOrder(activeOrderRef.current, true);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentStatusNormalized = order ? normalizeStatus(order.status) : 'PENDING';
  const currentIndex = STATUS_ORDER.indexOf(currentStatusNormalized);

  return (
    <>
      <style>{`
        .my-order-section {
          padding: 30px 15px;
        }

        .my-order-card {
          max-width: 600px;
          margin: auto;
          padding: 25px;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 5px 25px rgba(0,0,0,.08);
          border: 1px solid #e2e8f0;
        }

        .my-order-card h2 {
          margin-bottom: 8px;
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
        }

        .my-order-card p {
          color: #64748b;
          font-size: 0.875rem;
        }

        #orderCheckForm {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        #orderIdInput {
          flex: 1;
          padding: 13px;
          border: 1px solid #ddd;
          border-radius: 10px;
          font-family: inherit;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s ease-in-out;
        }

        #orderIdInput:focus {
          border-color: #0f172a;
        }

        #orderCheckForm button {
          padding: 13px 18px;
          border: 0;
          border-radius: 10px;
          cursor: pointer;
          background: #0f172a;
          color: #fff;
          font-weight: 700;
          font-size: 0.875rem;
          transition: background 0.15s ease-in-out;
        }

        #orderCheckForm button:hover {
          background: #1e293b;
        }

        #orderMessage {
          margin-top: 15px;
          font-size: 0.875rem;
          color: #64748b;
        }

        .order-result {
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
        }

        .order-result > div {
          margin-bottom: 8px;
          font-size: 0.925rem;
          color: #334155;
        }

        .order-result > div strong {
          color: #0f172a;
          margin-right: 6px;
        }

        .status-box {
          margin-top: 25px;
        }

        .status-box > strong {
          font-size: 0.95rem;
          color: #0f172a;
          display: block;
        }

        .status-timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
        }

        .status-step {
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: .4;
          transition: opacity 0.2s ease;
        }

        .status-step span {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ddd;
          font-size: 0.825rem;
          font-weight: 700;
          transition: all 0.2s ease;
        }

        .status-step label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
        }

        .status-step.completed,
        .status-step.current {
          opacity: 1;
        }

        .status-step.completed span,
        .status-step.current span {
          background: #111;
          color: #fff;
        }

        .current-status {
          margin-top: 20px;
          padding: 15px;
          border-radius: 10px;
          background: #f5f5f5;
          font-size: 0.925rem;
          color: #334155;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .current-status strong {
          color: #0f172a;
          font-size: 1rem;
        }
      `}</style>

      <section id="my-order" className="my-order-section">
        <div className="my-order-card">
          <h2>My Order</h2>
          <p>Enter your Order ID to check your latest order status.</p>

          <form id="orderCheckForm" onSubmit={handleSubmit}>
            <input
              id="orderIdInput"
              type="text"
              placeholder="Enter Order ID"
              autoComplete="off"
              required
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Checking...' : 'Check Order'}
            </button>
          </form>

          <div id="orderMessage">{message}</div>

          <div id="orderResult" className="order-result" hidden={!order}>
            {order && (
              <>
                <div>
                  <strong>Order ID:</strong>
                  <span id="displayOrderId">{order.orderId}</span>
                </div>

                <div>
                  <strong>Customer:</strong>
                  <span id="displayCustomerName">{order.customerName}</span>
                </div>

                <div>
                  <strong>Total:</strong>
                  ₹<span id="displayTotal">{Number(order.total || 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="status-box">
                  <strong>Order Status</strong>

                  <div className="status-timeline">
                    {STATUS_ORDER.map((stepStatus, idx) => {
                      const stepIndex = idx;
                      const isCompleted = stepIndex < currentIndex;
                      const isCurrent = stepIndex === currentIndex;
                      const stepClass = isCompleted ? 'completed' : isCurrent ? 'current' : '';

                      return (
                        <div
                          key={stepStatus}
                          className={`status-step ${stepClass}`}
                          data-status={stepStatus}
                        >
                          <span>{idx + 1}</span>
                          <label>{STATUS_LABELS[stepStatus]}</label>
                        </div>
                      );
                    })}
                  </div>

                  <div className="current-status">
                    <span>Current Status:</span>
                    <strong id="currentStatus">
                      {STATUS_LABELS[currentStatusNormalized] || currentStatusNormalized}
                    </strong>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};
