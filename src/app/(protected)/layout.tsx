"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { useAppStore } from "@/lib/store/useAppStore";
import { Sidebar } from "@/components/navigation/Sidebar";
import { BottomNav } from "@/components/navigation/BottomNav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!user) {
          try {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: userData.role,
                name: userData.name,
              });
            } else {
              auth.signOut();
              router.push("/login");
            }
          } catch (error) {
            console.error(error);
          }
        }
      } else {
        setUser(null);
        router.push("/login");
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, [user, setUser, router]);

  if (isInitializing) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading application...</div>;
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex min-h-screen bg-bgLight">
      <Sidebar />
      <div className="flex-1 md:ml-64 pb-20 md:pb-0 relative max-w-full overflow-x-hidden">
        <main className="min-h-screen p-4 md:p-8 pt-4">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
