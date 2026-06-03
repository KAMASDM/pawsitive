import React, { useEffect, useState } from "react";
import { ClipboardList, Truck } from "lucide-react";
import SellerShell from "./SellerShell";
import { useCommerceUser } from "../auth/useCommerceUser";
import { formatCurrency } from "../services/productService";
import { subscribeVendorOrders } from "../services/cartService";
import { updateOrderFulfillmentStatus } from "../services/adminOrderService";

const VendorOrders = () => {
  const { vendorId } = useCommerceUser();
  const [orders, setOrders] = useState([]);
  const [busy, setBusy] = useState("");

  useEffect(() => subscribeVendorOrders(vendorId, setOrders), [vendorId]);

  const updateStatus = async (orderId, fulfillmentStatus) => {
    setBusy(orderId);
    try {
      await updateOrderFulfillmentStatus({ orderId, vendorId, fulfillmentStatus, note: "Updated by seller." });
    } finally {
      setBusy("");
    }
  };

  return (
    <SellerShell title="Orders">
      <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
        {orders.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-violet-300" />
            <p className="mt-3 font-black text-slate-950">No orders yet</p>
          </div>
        ) : orders.map((order) => (
          <div key={order.id} className="border-t border-slate-100 p-4 first:border-t-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-slate-950">{order.orderNumber}</p>
                <p className="mt-1 text-sm text-slate-500">{order.customer?.name} · {order.paymentProvider === "cod" ? "Pay on delivery" : order.paymentProvider}</p>
              </div>
              <p className="font-black text-[#20164d]">{formatCurrency(order.amounts?.total)}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["processing", "shipped", "delivered", "cancelled"].map((status) => (
                <button
                  key={status}
                  disabled={busy === order.id}
                  onClick={() => updateStatus(order.id, status)}
                  className={`rounded-full px-3 py-1.5 text-xs font-black ${order.fulfillmentStatus === status ? "bg-[#20164d] text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              {order.items?.filter((item) => item.vendorId === vendorId).map((item) => (
                <p key={item.productId} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Truck className="h-4 w-4 text-violet-500" />
                  {item.title} x {item.quantity}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SellerShell>
  );
};

export default VendorOrders;
