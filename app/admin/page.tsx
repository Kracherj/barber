"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error || "Invalid credentials";
        
        // Show more helpful error messages
        if (errorMessage.includes("SUPABASE_SERVICE_ROLE_KEY")) {
          throw new Error("Server configuration error. Please check server logs.");
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_authenticated", "true");
      sessionStorage.setItem("admin_user", JSON.stringify(data.user));
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur l'administration.",
      });
    } catch (error: any) {
      toast({
        title: "Invalid Password",
        description: error.message || "Please enter the correct admin password.",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-white">Admin Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter admin password"
                  className="text-white placeholder:text-white/50 min-h-[44px]"
                />
              </div>
              <Button onClick={handleLogin} className="w-full min-h-[44px]" size="lg">
                Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beige py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <h1 className="text-4xl font-heading font-bold text-white">
              Admin Dashboard
            </h1>
            <Button
              variant="outline"
              onClick={async () => {
                await fetch("/api/admin/auth", { 
                  method: "DELETE",
                  credentials: "include",
                });
                setIsAuthenticated(false);
                sessionStorage.removeItem("admin_authenticated");
                sessionStorage.removeItem("admin_user");
                router.push("/");
              }}
              className="min-h-[44px] px-6 py-2.5 font-semibold hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
            >
              Logout
            </Button>
          </div>

          {/* Admin Control Panel */}
          <AdminDashboard />
        </div>
      </div>
    </div>
  );
}
