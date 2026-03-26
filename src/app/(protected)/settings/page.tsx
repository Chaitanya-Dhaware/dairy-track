"use client";
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAppStore, Product } from '@/lib/store/useAppStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { products, setProducts, user } = useAppStore();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unitType, setUnitType] = useState<'kg'|'ml'|'qty'>('kg');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchProducts();
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    
    if (products.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Product with this name already exists");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'products'), {
        name,
        price: Number(price),
        unitType,
        createdAt: serverTimestamp()
      });
      setName('');
      setPrice('');
      await fetchProducts(); // Refresh list
    } catch (err) {
      console.error("Error adding product", err);
      toast.error("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success("Product deleted");
      await fetchProducts();
    } catch (err) {
      console.error("Error deleting product", err);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="p-4 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-primary text-center md:text-left">Product Settings</h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Add Product</h2>
        <form onSubmit={handleAddProduct} className="space-y-4">
          <Input 
            placeholder="Product Name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
          />
          <div className="flex gap-4">
            <Input 
              type="number" 
              placeholder="Price (₹)" 
              value={price} 
              onChange={e => setPrice(e.target.value)} 
              required 
              min="0"
              step="0.01"
              className="flex-1"
            />
            <select 
              value={unitType} 
              onChange={e => setUnitType(e.target.value as any)}
              className="h-12 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-28 md:w-32"
            >
              <option value="kg">kg/L</option>
              <option value="ml">ml/gm</option>
              <option value="qty">qty/pc</option>
            </select>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Product"}
          </Button>
        </form>
      </div>

      <div className="space-y-3 pb-8">
        {fetching ? (
          <p className="text-center text-gray-500">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No products found. Add some above.</p>
        ) : (
          products.map(product => (
            <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-gray-100">
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-lg">{product.name}</p>
                <div className="flex gap-6 text-sm mt-1 text-gray-500">
                  <span><span className="font-medium text-gray-400">Price:</span> ₹{product.price}</span>
                  <span><span className="font-medium text-gray-400">Unit:</span> {product.unitType}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-4">
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="p-3 bg-red-50 text-danger rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
