"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardIndexPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login?redirect=/dashboard");
      return;
    }

    if (role === "admin") {
      router.replace("/dashboard/admin");
    } else if (role === "counsellor") {
      router.replace("/dashboard/counsellor");
    } else {
      router.replace("/dashboard/client");
    }
  }, [user, role, loading, router]);

  return (
    <div className="page-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div className="spinner" />
    </div>
  );
}
