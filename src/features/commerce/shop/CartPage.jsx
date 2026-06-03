import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Package, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatCurrency } from "../services/productService";
import { subscribeActiveCart, updateCartItemQuantity } from "../services/cartService";

const CartPage = () => {
  const [cart, setCart] = useState(null);
  const items = cart?.status === "active" ? cart.items || [] : [];

  useEffect(() => subscribeActiveCart(setCart), []);

  return (
    <div className="min-h-screen bg-[#f7f4ff] px-4 py-5 pb-28 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-5xl">
        <div className="mb-5 rounded-3xl bg-[#20164d] p-5 text-white shadow-xl shadow-violet-200/70">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black">
            <ShoppingBag className="h-4 w-4" />
            Pawppy cart
          </span>
          <h1 className="mt-4 text-3xl font-black">Cart</h1>
          <p className="mt-2 text-sm text-violet-100">Review items before placing a pay-on-delivery order.</p>
        </div>

        {items.length === 0 ? (
          <section className="rounded-3xl border border-violet-100 bg-white p-10 text-center shadow-sm">
            <Package className="mx-auto h-12 w-12 text-violet-300" />
            <h2 className="mt-3 text-xl font-black text-slate-950">Your cart is empty</h2>
            <Link to="/shop" className="mt-5 inline-flex rounded-full bg-[#20164d] px-5 py-3 text-sm font-black text-white">Browse shop</Link>
          </section>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <section className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item.productId} className="grid gap-3 p-4 sm:grid-cols-[72px_1fr_auto] sm:items-center">
                    <div className="h-[72px] w-[72px] overflow-hidden rounded-2xl bg-violet-50">
                      {item.image ? <img src={item.image} alt={item.title} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div>
                      <h2 className="font-black text-slate-950">{item.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">SKU {item.sku}</p>
                      <p className="mt-1 font-black text-[#20164d]">{formatCurrency(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)} className="rounded-full bg-slate-100 p-2"><Minus className="h-4 w-4" /></button>
                      <span className="w-8 text-center font-black">{item.quantity}</span>
                      <button onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)} className="rounded-full bg-slate-100 p-2"><Plus className="h-4 w-4" /></button>
                      <button onClick={() => updateCartItemQuantity(item.productId, 0)} className="rounded-full bg-rose-50 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="h-fit rounded-3xl border border-violet-100 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">Summary</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-black">{formatCurrency(cart?.subtotal || 0)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Shipping</span><span className="font-black">Calculated at checkout</span></div>
              </div>
              <Link to="/checkout" className="mt-5 flex w-full justify-center rounded-xl bg-[#20164d] px-4 py-3 text-sm font-black text-white">
                Continue to checkout
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default CartPage;
