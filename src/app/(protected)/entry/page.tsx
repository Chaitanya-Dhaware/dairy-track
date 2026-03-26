"use client";
import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAppStore, Product } from '@/lib/store/useAppStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';

export default function EntryPage() {
  const { products, setProducts, user } = useAppStore();
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shopName, setShopName] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [paymentStatus, setPaymentStatus] = useState<'paid'|'due'>('paid');
  const [remarks, setRemarks] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(products.length === 0);

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, []);

  const fetchProducts = async () => {
    try {
      setFetching(true);
      const q = query(collection(db, 'products'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const docs: Product[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(docs);
    } catch (err) {
      console.error("Error fetching products", err);
    } finally {
      setFetching(false);
    }
  };

  const handleQuantityChange = (productId: string, val: string) => {
    setQuantities(prev => ({ ...prev, [productId]: val }));
  };

  const calculateTotal = () => {
    return products.reduce((acc, p) => {
      const q = Math.max(0, Number(quantities[p.id]) || 0);
      const price = Number(p.price) || 0;
      return acc + (q * price);
    }, 0);
  };

  const grandTotal = calculateTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || grandTotal === 0) {
      alert("Please enter shop name and at least one product quantity.");
      return;
    }

    setLoading(true);
    try {
      const entryProducts = products
        .filter(p => (Number(quantities[p.id]) || 0) > 0)
        .map(p => {
          const q = Number(quantities[p.id]) || 0;
          const price = Number(p.price) || 0;
          return {
            productId: p.id,
            name: p.name,
            quantity: q,
            unitType: p.unitType,
            price: price,
            total: q * price
          }
        });

      await addDoc(collection(db, 'entries'), {
        date,
        shopName,
        createdBy: user?.uid,
        products: entryProducts,
        totalAmount: grandTotal,
        paymentStatus,
        dueAmount: paymentStatus === 'due' ? grandTotal : 0,
        remarks,
        createdAt: serverTimestamp()
      });

      alert("Entry saved successfully!");
      
      // Reset form
      setShopName('');
      setQuantities({});
      setPaymentStatus('paid');
      setRemarks('');
      
    } catch (err) {
      console.error("Error saving entry", err);
      alert("Failed to save entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-8 relative">
      <h1 className="text-2xl font-bold text-primary text-center md:text-left">New Entry</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-4 border border-gray-100">
          <Input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            required 
            className="font-medium text-gray-700"
          />
          <Input 
            type="text" 
            placeholder="Shop Name" 
            value={shopName} 
            onChange={e => setShopName(e.target.value)} 
            required 
            className="font-medium text-gray-700"
          />
        </div>

        {fetching ? (
          <p className="text-center text-gray-500 py-8">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-red-500 bg-red-50 p-6 rounded-2xl border border-red-100 font-medium">No products found. Admin must add products first.</p>
        ) : (
          <div className="space-y-3">
            {products.map(product => {
              const qty = quantities[product.id] || '';
              const price = Number(product.price) || 0;
              const rowTotal = (Number(qty) || 0) * price;

              return (
                <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-lg">{product.name}</p>
                    <p className="text-sm font-medium text-gray-500 mt-1">₹{price} / {product.unitType}</p>
                  </div>
                  
                  <div className="flex flex-col items-end justify-center w-28">
                    <div className="flex items-center">
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0"
                        value={qty} 
                        onChange={e => handleQuantityChange(product.id, e.target.value)} 
                        className="w-20 text-center h-12 font-bold text-lg border-gray-200 bg-gray-50 focus:bg-white"
                      />
                    </div>
                    {rowTotal > 0 && (
                      <p className="text-sm font-bold text-primary mt-1">₹{rowTotal.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sticky footer for grand total and submit */}
        <div className="bg-white p-5 rounded-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] space-y-5 border-2 border-primary/20 sticky bottom-20 md:bottom-2 z-40 transition-all">
          <div className="flex justify-between items-center text-xl font-bold text-gray-800 px-2">
            <span>Grand Total</span>
            <span className="text-3xl text-primary font-black">₹{grandTotal.toFixed(2)}</span>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-600 mb-3 px-2 uppercase tracking-wide">Payment Status</p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${
                  paymentStatus === 'paid' 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary ring-offset-2' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                PAID
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('due')}
                className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all ${
                  paymentStatus === 'due' 
                    ? 'bg-danger text-white shadow-lg shadow-danger/30 ring-2 ring-danger ring-offset-2' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                DUE
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Input 
              type="text" 
              placeholder="Remarks (Optional)" 
              value={remarks} 
              onChange={e => setRemarks(e.target.value)} 
              className="bg-gray-50 border-gray-200"
            />
          </div>

          <Button type="submit" disabled={loading} size="lg" className="w-full text-lg shadow-xl shadow-primary/20 h-14 rounded-xl">
            {loading ? "Submitting..." : "Submit Entry"}
          </Button>
        </div>
      </form>
    </div>
  );
}
