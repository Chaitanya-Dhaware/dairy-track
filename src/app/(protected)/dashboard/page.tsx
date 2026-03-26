"use client";
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAppStore } from '@/lib/store/useAppStore';
import { format, subDays, parseISO } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Entry {
  id: string;
  date: string;
  shopName: string;
  products: any[];
  totalAmount: number;
  paymentStatus: 'paid' | 'due';
  dueAmount: number;
}

export default function DashboardPage() {
  const { user } = useAppStore();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'entries'));
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Entry));
      setEntries(docs);
    } catch (err) {
      console.error("Error fetching entries", err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="p-4 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Stats
  const todayEntries = entries.filter(e => e.date === todayStr);
  const totalSalesToday = todayEntries.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalRevenue = entries.filter(e => e.paymentStatus === 'paid').reduce((sum, e) => sum + e.totalAmount, 0);
  const totalDue = entries.reduce((sum, e) => sum + e.dueAmount, 0);
  const uniqueShops = new Set(entries.map(e => e.shopName)).size;

  // Last 7 days chart data
  const last7Days = Array.from({ length: 7 }).map((_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')).reverse();
  const salesTrendData = last7Days.map(date => {
    const dayEntries = entries.filter(e => e.date === date);
    const total = dayEntries.reduce((sum, e) => sum + e.totalAmount, 0);
    return { name: format(parseISO(date), 'E'), total };
  });

  // Product performance data
  const productMap: Record<string, number> = {};
  entries.forEach(entry => {
    entry.products.forEach(p => {
      productMap[p.name] = (productMap[p.name] || 0) + p.total;
    });
  });
  const productPerformanceData = Object.entries(productMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5); // Top 5

  const recentEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <h1 className="text-2xl font-bold text-primary text-center md:text-left">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-sm text-gray-500 font-semibold mb-1 uppercase tracking-wider">Sales Today</p>
          <p className="text-3xl font-black text-gray-900">₹{totalSalesToday.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-sm text-gray-500 font-semibold mb-1 uppercase tracking-wider">Total Revenue</p>
          <p className="text-3xl font-black text-primary">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-sm text-gray-500 font-semibold mb-1 uppercase tracking-wider">Due Amount</p>
          <p className="text-3xl font-black text-danger">₹{totalDue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-sm text-gray-500 font-semibold mb-1 uppercase tracking-wider">Shops Visited</p>
          <p className="text-3xl font-black text-gray-900">{uniqueShops}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Sales Trend (Last 7 Days)</h2>
          <div className="h-64 w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dx={-10} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}
                    cursor={{fill: 'transparent', stroke: '#e2e8f0', strokeWidth: 2}}
                  />
                  <Line type="monotone" dataKey="total" stroke="#6BBA83" strokeWidth={4} dot={{r: 4, fill: '#6BBA83', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Product Performance Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Top Products by Revenue</h2>
          <div className="h-64 w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Loading chart...</div>
            ) : productPerformanceData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productPerformanceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8faf9'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}
                  />
                  <Bar dataKey="total" fill="#6BBA83" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Recent Entries</h2>
          <a href="/reports" className="text-sm font-semibold text-primary hover:underline transition-colors">View All &gt;</a>
        </div>
        <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500 font-medium">Loading entries...</div>
            ) : recentEntries.length === 0 ? (
              <div className="p-8 text-center text-gray-500 font-medium">No sales entries yet.</div>
            ) : (
              recentEntries.map(entry => (
                <div key={entry.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900 text-base">{entry.shopName}</p>
                    <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wide">{entry.date}</p>
                  </div>
                  <div className="flex items-center gap-5">
                    <p className="font-black text-gray-900 text-lg">₹{entry.totalAmount.toFixed(2)}</p>
                    <span className={`px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-md ${
                      entry.paymentStatus === 'paid' ? 'bg-[#eef5f0] text-primary' : 'bg-[#fcede8] text-danger'
                    }`}>
                      {entry.paymentStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
        </div>
      </div>
    </div>
  );
}
