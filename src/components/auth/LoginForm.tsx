"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { useAppStore } from "@/lib/store/useAppStore";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

export function LoginForm() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  
  const [identifier, setIdentifier] = useState(""); // Email or Phone
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  
  const [loading, setLoading] = useState(false);
  const { setUser } = useAppStore();
  const router = useRouter();

  const normalizeIdentifier = (input: string) => {
    input = input.trim();
    if (input && !input.includes('@')) {
      // If it looks like a phone number or username, convert to pseudo-email
      return `${input.replace(/[^a-zA-Z0-9]/g, '')}@dairytrack.com`;
    }
    return input;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const email = normalizeIdentifier(identifier);

    try {
      if (mode === 'signup') {
        if (!name || !identifier || !password) {
          toast.error("Please fill all fields");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save role and name to Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: email,
          name: name,
          role: role,
        });

        toast.success("Account created successfully!");
        
        setUser({
          uid: user.uid,
          email: user.email,
          role: role,
          name: name,
        });

        if (role === "admin") router.push("/dashboard");
        else router.push("/entry");

      } else if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            uid: user.uid,
            email: user.email,
            role: userData.role,
            name: userData.name,
          });

          toast.success(`Welcome back, ${userData.name || 'User'}!`);
          
          if (userData.role === "admin") router.push("/dashboard");
          else router.push("/entry");
        } else {
          toast.error("User role not found. Contact admin.");
          auth.signOut();
        }

      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        toast.success("Password reset link sent! Check your email (if you used a real email address).");
        setMode('login');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error("An account with this email/number already exists.");
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error("Invalid credentials.");
      } else {
        toast.error(err.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-primary/5 border border-gray-100 transition-all">
      <div className="mb-8 flex flex-col items-center justify-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-3xl font-black text-primary shadow-inner">
          D
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h1>
        <p className="text-sm text-gray-500 mt-2 font-medium">Dairy Track Management System</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Full Name</label>
            <Input
              type="text"
              placeholder="E.g. John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Email or Mobile Number</label>
          <Input
            type="text"
            placeholder="E.g. name@email.com or 9876543210"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        {mode !== 'forgot' && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Password</label>
            <Input
              type="password"
              placeholder="Enter your secret password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        )}

        {mode === 'signup' && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1 mb-1 block">Select Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin'|'staff')}
              className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="staff">Staff (Data Entry Only)</option>
              <option value="admin">Admin (Full Access & Reports)</option>
            </select>
          </div>
        )}

        {mode === 'login' && (
          <div className="flex justify-end pt-1">
            <button 
              type="button" 
              onClick={() => { setMode('forgot'); setPassword(''); }} 
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <div className="pt-2">
          <Button type="submit" className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20 rounded-xl" disabled={loading}>
            {loading ? "Processing..." : mode === 'login' ? "Login to Dashboard" : mode === 'signup' ? "Complete Sign Up" : "Send Reset Link"}
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-2">
        {mode === 'login' ? (
          <p className="text-sm text-gray-600 font-medium">
            Don't have an account?{' '}
            <button type="button" onClick={() => setMode('signup')} className="font-bold text-primary hover:underline">Sign Up</button>
          </p>
        ) : (
          <p className="text-sm text-gray-600 font-medium">
            Already have an account?{' '}
            <button type="button" onClick={() => { setMode('login'); setPassword(''); }} className="font-bold text-primary hover:underline">Back to Login</button>
          </p>
        )}
      </div>
    </div>
  );
}
