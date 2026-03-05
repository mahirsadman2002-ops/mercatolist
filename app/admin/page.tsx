"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, MessageSquare, Flag, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface OverviewData {
  totalActiveListings: number;
  totalUsers: number;
  inquiriesThisWeek: number;
  pendingReports: number;
  overdueConfirmations: number;
  unresolvedReports: number;
  staleListings: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  weeklyChartData: Array<{
    week: string;
    listings: number;
    users: number;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics/overview")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
      </div>
    );
  }

  const statCards = [
    { label: "Active Listings", value: data.totalActiveListings, icon: Building2, color: "text-blue-600" },
    { label: "Total Users", value: data.totalUsers, icon: Users, color: "text-green-600" },
    { label: "Inquiries This Week", value: data.inquiriesThisWeek, icon: MessageSquare, color: "text-purple-600" },
    { label: "Pending Reports", value: data.pendingReports, icon: Flag, color: "text-red-600" },
  ];

  const alerts = [
    { condition: data.overdueConfirmations > 0, label: "Overdue Confirmations", count: data.overdueConfirmations, icon: Clock, variant: "destructive" as const },
    { condition: data.unresolvedReports > 0, label: "Unresolved Reports", count: data.unresolvedReports, icon: AlertTriangle, variant: "destructive" as const },
    { condition: data.staleListings > 0, label: "Stale Listings (30+ days, 0 inquiries)", count: data.staleListings, icon: TrendingUp, variant: "secondary" as const },
  ].filter((a) => a.condition);

  const activityTypeStyles: Record<string, string> = {
    listing_created: "bg-blue-100 text-blue-700",
    user_registered: "bg-green-100 text-green-700",
    inquiry_sent: "bg-purple-100 text-purple-700",
    report_filed: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value.toLocaleString()}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <Card key={alert.label} className="border-amber-200 bg-amber-50">
                <CardContent className="flex items-center gap-3 p-4">
                  <Icon className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-amber-900">{alert.label}</p>
                  </div>
                  <Badge variant={alert.variant}>{alert.count}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Listings (12 Weeks)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="listings"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Users (12 Weeks)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  <Badge
                    className={`shrink-0 text-[10px] uppercase ${
                      activityTypeStyles[activity.type] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {activity.type.replace("_", " ")}
                  </Badge>
                  <span className="flex-1 text-muted-foreground">{activity.description}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
