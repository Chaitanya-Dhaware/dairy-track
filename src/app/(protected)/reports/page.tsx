"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/lib/store/useAppStore';
import toast from 'react-hot-toast';

interface Entry {
  id: string;
  date: string;
  shopName: string;
  products: any[];
  totalAmount: number;
  paymentStatus: 'paid' | 'due';
  dueAmount: number;
  remarks: string;
  createdAt: Timestamp;
}

export default function ReportsPage() {
  const { user } = useAppStore();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchShop, setSearchShop] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'due'>('all');

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'entries'), orderBy('date', 'desc'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Entry));
      setEntries(docs);
    } catch (err) {
      console.error("Error fetching entries", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleMarkPaid = async (id: string, total: number) => {
    if (!confirm("Confirm marking this entry as PAID?")) return;
    try {
      await updateDoc(doc(db, 'entries', id), {
        paymentStatus: 'paid',
        dueAmount: 0 // Reset due
      });
      toast.success("Marked as Paid successfully!");
      await fetchEntries();
    } catch (err) {
      console.error("Error updating status", err);
      toast.error("Failed to update status");
    }
  };

  const filteredEntries = entries.filter(entry => {
    let match = true;
    if (startDate && entry.date < startDate) match = false;
    if (endDate && entry.date > endDate) match = false;
    if (searchShop && !entry.shopName.toLowerCase().includes(searchShop.toLowerCase())) match = false;
    if (statusFilter !== 'all' && entry.paymentStatus !== statusFilter) match = false;
    return match;
  });

  if (user?.role !== 'admin') {
    return <div className="p-4 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-primary">Reports & History</h1>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 border border-gray-100">
        <div>
          <label className="text-xs text-gray-500 mb-1 font-medium block uppercase tracking-wider">Start Date</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 font-medium block uppercase tracking-wider">End Date</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 font-medium block uppercase tracking-wider">Shop Name</label>
          <Input placeholder="Search shop..." value={searchShop} onChange={e => setSearchShop(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 font-medium block uppercase tracking-wider">Payment Status</label>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full h-12 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="due">Due</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-gray-600 border-collapse">
            <thead className="bg-[#eef5f0] text-primary font-bold">
              <tr>
                <th className="px-5 py-4 whitespace-nowrap">Date</th>
                <th className="px-5 py-4 min-w-[150px]">Shop</th>
                <th className="px-5 py-4 min-w-[200px]">Products</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">Total</th>
                <th className="px-5 py-4 whitespace-nowrap text-center">Status</th>
                <th className="px-5 py-4 whitespace-nowrap text-right">Due Amt</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500 font-medium tracking-wide">Fetching latest data...</td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500 font-medium">No sales entries match your current filters.</td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-[#f8faf9] transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-700">{entry.date}</td>
                    <td className="px-5 py-4 font-bold text-gray-900">{entry.shopName}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        {entry.products.map(p => (
                          <div key={p.productId} className="text-xs bg-gray-50 inline-block px-2 py-1 rounded">
                            <span className="font-semibold text-gray-700">{p.name}:</span> {p.quantity} {p.unitType}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-gray-900 text-base">₹{entry.totalAmount.toFixed(2)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                        entry.paymentStatus === 'paid' ? 'bg-[#eef5f0] text-primary' : 'bg-[#fcede8] text-danger'
                      }`}>
                        {entry.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-danger">
                      {entry.dueAmount > 0 ? `₹${entry.dueAmount.toFixed(2)}` : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {entry.paymentStatus === 'due' && (
                        <button 
                          onClick={() => handleMarkPaid(entry.id, entry.totalAmount)}
                          className="text-xs font-bold text-white bg-primary px-4 py-2 rounded-lg hover:bg-primary/90 shadow-md whitespace-nowrap active:scale-95 transition-transform uppercase"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
