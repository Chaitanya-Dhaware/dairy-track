"use client";
import React from 'react';
import { auth } from '@/lib/firebase/config';
import { useAppStore } from '@/lib/store/useAppStore';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const { user } = useAppStore();

  const handleLogout = async () => {
    await auth.signOut();
  };

  return (
    <div className="space-y-6 max-w-sm mx-auto bg-white p-8 rounded-2xl shadow-sm">
      <h1 className="text-2xl font-bold text-primary text-center">Profile</h1>
      <div className="space-y-2 text-center">
        <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto flex items-center justify-center text-primary text-3xl font-bold mb-4">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <h2 className="text-xl font-semibold text-gray-800">{user?.name || 'User'}</h2>
        <p className="text-gray-500">{user?.email}</p>
        <div className="inline-block mt-4 px-4 py-1.5 bg-gray-100 rounded-full text-sm font-medium capitalize text-gray-700">
          Role: {user?.role || 'Guest'}
        </div>
      </div>
      <div className="pt-8">
        <Button onClick={handleLogout} variant="outline" className="w-full text-danger border-danger/30 hover:bg-danger/10">
          Logout
        </Button>
      </div>
    </div>
  );
}
