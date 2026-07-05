import { useState, useEffect } from "react";
import { loginUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Check if the user was just redirected from registration
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") {
      setShowSuccess(true);
      // Clean up the URL query parameter silently so it doesn't stay on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const data = await loginUser(email, password);
      localStorage.setItem("token", data.access_token);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center gap-4">
      {/* Registration success message rendered OUTSIDE the box */}
      {showSuccess && (
        <div className="w-full max-w-sm p-3.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium shadow-sm">
          Registration successful! You can now log in below.
        </div>
      )}

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit">Login</Button>
            <p className="text-sm text-center">
              No account? <a href="/register" className="underline font-semibold">Register</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

