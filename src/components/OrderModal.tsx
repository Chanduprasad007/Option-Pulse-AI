import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, ShoppingCart } from 'lucide-react';
import { KotakOrder, KotakService } from '@/src/services/kotakService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrder?: Partial<KotakOrder>;
}

export function OrderModal({ isOpen, onClose, initialOrder }: OrderModalProps) {
  const [order, setOrder] = useState<KotakOrder>({
    symbol: initialOrder?.symbol || 'NIFTY',
    strike: initialOrder?.strike || 22500,
    optionType: initialOrder?.optionType || 'CE',
    transactionType: initialOrder?.transactionType || 'BUY',
    quantity: initialOrder?.quantity || 50,
    price: initialOrder?.price || 0,
    orderType: initialOrder?.orderType || 'MARKET',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [orderId, setOrderId] = useState<string | null>(null);

  const handlePlaceOrder = async () => {
    setStatus('loading');
    const result = await KotakService.placeOrder(order);
    if (result.success) {
      setStatus('success');
      setOrderId(result.orderId!);
      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 3000);
    } else {
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#151619] border border-[#2A2D32] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-[#2A2D32] flex items-center justify-between bg-[#1A1D21]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#4A90E2]" />
                <h2 className="text-white font-bold font-mono text-xs uppercase tracking-widest">Place Order</h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-[#2A2D32] rounded-full transition-colors">
                <X className="w-4 h-4 text-[#8E9299]" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {status === 'success' ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Order Placed!</h3>
                  <p className="text-[#8E9299] text-sm">Order ID: <span className="text-white font-mono">{orderId}</span></p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-[#8E9299] uppercase">Symbol</label>
                      <div className="bg-[#1A1D21] border border-[#2A2D32] px-3 py-2 rounded text-white font-bold">
                        {order.symbol} {order.strike} {order.optionType}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-[#8E9299] uppercase">Type</label>
                      <div className="flex bg-[#1A1D21] border border-[#2A2D32] rounded p-0.5">
                        <button
                          onClick={() => setOrder({ ...order, transactionType: 'BUY' })}
                          className={cn(
                            "flex-1 py-1.5 text-[10px] font-bold rounded transition-all",
                            order.transactionType === 'BUY' ? "bg-emerald-500 text-white" : "text-[#8E9299]"
                          )}
                        >
                          BUY
                        </button>
                        <button
                          onClick={() => setOrder({ ...order, transactionType: 'SELL' })}
                          className={cn(
                            "flex-1 py-1.5 text-[10px] font-bold rounded transition-all",
                            order.transactionType === 'SELL' ? "bg-rose-500 text-white" : "text-[#8E9299]"
                          )}
                        >
                          SELL
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-[#8E9299] uppercase">Quantity</label>
                      <input
                        type="number"
                        value={order.quantity}
                        onChange={(e) => setOrder({ ...order, quantity: parseInt(e.target.value) })}
                        className="w-full bg-[#1A1D21] border border-[#2A2D32] px-3 py-2 rounded text-white focus:outline-none focus:border-[#4A90E2]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-[#8E9299] uppercase">Price Type</label>
                      <select
                        value={order.orderType}
                        onChange={(e) => setOrder({ ...order, orderType: e.target.value as any })}
                        className="w-full bg-[#1A1D21] border border-[#2A2D32] px-3 py-2 rounded text-white focus:outline-none focus:border-[#4A90E2]"
                      >
                        <option value="MARKET">MARKET</option>
                        <option value="LIMIT">LIMIT</option>
                      </select>
                    </div>
                  </div>

                  {order.orderType === 'LIMIT' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-[#8E9299] uppercase">Limit Price</label>
                      <input
                        type="number"
                        value={order.price}
                        onChange={(e) => setOrder({ ...order, price: parseFloat(e.target.value) })}
                        className="w-full bg-[#1A1D21] border border-[#2A2D32] px-3 py-2 rounded text-white focus:outline-none focus:border-[#4A90E2]"
                      />
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="flex items-center gap-2 text-rose-500 text-xs bg-rose-500/10 p-3 rounded border border-rose-500/20">
                      <AlertCircle className="w-4 h-4" />
                      <span>Failed to place order. Please check your connection.</span>
                    </div>
                  )}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={status === 'loading'}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2",
                      order.transactionType === 'BUY' ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600",
                      status === 'loading' && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {status === 'loading' ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {order.transactionType} {order.quantity} {order.symbol}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
