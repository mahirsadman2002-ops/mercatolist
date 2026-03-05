"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];

const DATE_RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1y", days: 365 },
  { label: "All", days: 0 },
];

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [listingsData, setListingsData] = useState<any>(null);
  const [usersData, setUsersData] = useState<any>(null);
  const [engagementData, setEngagementData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/analytics/listings").then((r) => r.json()),
      fetch("/api/admin/analytics/users").then((r) => r.json()),
      fetch("/api/admin/analytics/engagement").then((r) => r.json()),
    ])
      .then(([listings, users, engagement]) => {
        if (listings.success) setListingsData(listings.data);
        if (users.success) setUsersData(users.data);
        if (engagement.success) setEngagementData(engagement.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dateRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Detailed Analytics</h1>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-64 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statusData = listingsData?.byStatus
    ? Object.entries(listingsData.byStatus).map(([name, value]) => ({ name: name.replace("_", " "), value }))
    : [];

  const categoryData = listingsData?.byCategory || [];
  const boroughData = listingsData?.byBorough
    ? Object.entries(listingsData.byBorough).map(([name, value]) => ({ name: name.replace("_", " "), value }))
    : [];

  const roleData = usersData?.byRole
    ? Object.entries(usersData.byRole).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Detailed Analytics</h1>
        <div className="flex gap-1">
          {DATE_RANGES.map((range) => (
            <Button
              key={range.label}
              variant={dateRange === range.label ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(range.label)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Listings Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Listings</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="text-sm">By Status</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">By Category (Top 10)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">By Borough</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={boroughData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Avg Asking Price</p>
              <p className="text-2xl font-bold mt-1">
                {listingsData?.avgAskingPrice
                  ? `$${Number(listingsData.avgAskingPrice).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                  : "$0"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Sell-Through Rate</p>
              <p className="text-2xl font-bold mt-1">
                {listingsData?.sellThroughRate != null
                  ? `${Number(listingsData.sellThroughRate).toFixed(1)}%`
                  : "0%"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Users Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Users</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold mt-1">{usersData?.totalUsers ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">New This Month</p>
              <p className="text-2xl font-bold mt-1">{usersData?.newThisMonth ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">New This Week</p>
              <p className="text-2xl font-bold mt-1">{usersData?.newThisWeek ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">User Growth (12 Weeks)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usersData?.growthData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">By Role</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {roleData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Brokers */}
        {usersData?.topBrokers?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Top Brokers</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Listings</TableHead>
                    <TableHead className="text-right">Inquiries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData.topBrokers.map((broker: any) => (
                    <TableRow key={broker.id}>
                      <TableCell className="font-medium">{broker.name}</TableCell>
                      <TableCell className="text-muted-foreground">{broker.email}</TableCell>
                      <TableCell className="text-right">{broker.listingCount}</TableCell>
                      <TableCell className="text-right">{broker.inquiryCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Engagement Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Engagement</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold mt-1">{(engagementData?.totalViews ?? 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Inquiries</p>
              <p className="text-2xl font-bold mt-1">{(engagementData?.totalInquiries ?? 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Messages</p>
              <p className="text-2xl font-bold mt-1">{(engagementData?.totalMessages ?? 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[
            { title: "Most Viewed", data: engagementData?.topViewedListings, key: "viewCount", label: "Views" },
            { title: "Most Saved", data: engagementData?.topSavedListings, key: "saveCount", label: "Saves" },
            { title: "Most Inquired", data: engagementData?.topInquiredListings, key: "inquiryCount", label: "Inquiries" },
          ].map((section) => (
            <Card key={section.title}>
              <CardHeader><CardTitle className="text-sm">{section.title}</CardTitle></CardHeader>
              <CardContent>
                {(!section.data || section.data.length === 0) ? (
                  <p className="text-sm text-muted-foreground py-4">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {section.data.slice(0, 10).map((item: any, i: number) => (
                      <div key={item.id || i} className="flex items-center justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 ml-2">
                          {item[section.key]} {section.label.toLowerCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
