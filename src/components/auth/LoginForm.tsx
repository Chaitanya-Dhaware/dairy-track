"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { useAppStore } from "@/lib/store/useAppStore";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAppStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
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

        if (userData.role === "admin") {
          router.push("/dashboard");
        } else {
          router.push("/entry");
        }
      } else {
        setError("User role not found. Please contact admin.");
        auth.signOut();
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
      <div className="mb-8 flex flex-col items-center justify-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-2xl font-bold text-primary">
          D
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Login</h1>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Email or Mobile"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" className="w-full text-base font-semibold" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </div>
  );
}
