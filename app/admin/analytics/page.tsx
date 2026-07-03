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
  const [searchData, setSearchData] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Daily chart caps at 90 points; 1y/All fall back to the 90-day window.
    const rangeDays = DATE_RANGES.find((r) => r.label === dateRange)?.days || 30;
    const dailyDays = rangeDays === 0 || rangeDays > 90 ? 90 : rangeDays;
    Promise.all([
      fetch("/api/admin/analytics/listings").then((r) => r.json()),
      fetch("/api/admin/analytics/users").then((r) => r.json()),
      fetch("/api/admin/analytics/engagement").then((r) => r.json()),
      fetch("/api/admin/analytics/searches").then((r) => r.json()),
      fetch(`/api/admin/analytics/daily?days=${dailyDays}`).then((r) => r.json()),
    ])
      .then(([listings, users, engagement, searches, daily]) => {
        if (listings.success) setListingsData(listings.data);
        if (users.success) setUsersData(users.data);
        if (engagement.success) setEngagementData(engagement.data);
        if (searches.success) setSearchData(searches.data);
        if (daily.success) setDailyData(daily.data);
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
  // byBorough is an array of { borough, count } (not a Record) — map it to the
  // { name, value } shape the chart's dataKeys expect. Rendering the raw
  // objects is what caused React error #31.
  const boroughData = Array.isArray(listingsData?.byBorough)
    ? listingsData.byBorough.map((b: { borough: string; count: number }) => ({
        name: String(b.borough).replace("_", " "),
        value: b.count,
      }))
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

      {/* Daily Activity Section */}
      {dailyData?.series && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Daily Activity</h2>
            <p className="text-sm text-muted-foreground">
              Site visits, new listings, new users, and inquiries per day
              (last {dailyData.days} days).
            </p>
          </div>

          {/* Totals for the window */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Site Visits", value: dailyData.totals.visits, color: "#3b82f6" },
              { label: "New Listings", value: dailyData.totals.listings, color: "#10b981" },
              { label: "New Users", value: dailyData.totals.users, color: "#f59e0b" },
              { label: "Inquiries Sent", value: dailyData.totals.inquiries, color: "#ef4444" },
            ].map((tile) => (
              <Card key={tile.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: tile.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {tile.label}
                    </span>
                  </div>
                  <div className="mt-1 text-2xl font-bold tabular-nums">
                    {tile.value.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Daily trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daily Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData.series} margin={{ left: -10, right: 8 }}>
                  <defs>
                    {[
                      { id: "gVisits", c: "#3b82f6" },
                      { id: "gListings", c: "#10b981" },
                      { id: "gUsers", c: "#f59e0b" },
                      { id: "gInquiries", c: "#ef4444" },
                    ].map((g) => (
                      <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={g.c} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={g.c} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(d: string) => d.slice(5)}
                    minTickGap={24}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={40} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="visits" name="Visits" stroke="#3b82f6" fill="url(#gVisits)" strokeWidth={2} />
                  <Area type="monotone" dataKey="listings" name="Listings" stroke="#10b981" fill="url(#gListings)" strokeWidth={2} />
                  <Area type="monotone" dataKey="users" name="Users" stroke="#f59e0b" fill="url(#gUsers)" strokeWidth={2} />
                  <Area type="monotone" dataKey="inquiries" name="Inquiries" stroke="#ef4444" fill="url(#gInquiries)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>
      )}

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
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {statusData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
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
                    <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {roleData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Advisors */}
        {usersData?.topBrokers?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Top Advisors</CardTitle></CardHeader>
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

      {/* Search Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Search</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total Searches</p>
              <p className="text-2xl font-bold mt-1">{(searchData?.totalSearches ?? 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Searches With No Results</p>
              <p className="text-2xl font-bold mt-1">
                {(searchData?.zeroResultCount ?? 0).toLocaleString()}
                {searchData?.totalSearches > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({((searchData.zeroResultCount / searchData.totalSearches) * 100).toFixed(0)}%)
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">Top Search Terms</CardTitle></CardHeader>
            <CardContent>
              {(!searchData?.topSearches || searchData.topSearches.length === 0) ? (
                <p className="text-sm text-muted-foreground py-4">No searches logged yet</p>
              ) : (
                <div className="space-y-3">
                  {searchData.topSearches.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <p className="truncate font-medium">{item.query}</p>
                      <Badge variant="secondary" className="shrink-0 ml-2">
                        {item.count} {item.count === 1 ? "search" : "searches"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Unmet Demand (Zero Results)</CardTitle>
              <p className="text-xs text-muted-foreground">What buyers search for that you don&apos;t have — recruit this inventory.</p>
            </CardHeader>
            <CardContent>
              {(!searchData?.zeroResultSearches || searchData.zeroResultSearches.length === 0) ? (
                <p className="text-sm text-muted-foreground py-4">No zero-result searches yet</p>
              ) : (
                <div className="space-y-3">
                  {searchData.zeroResultSearches.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <p className="truncate font-medium">{item.query}</p>
                      <Badge variant="outline" className="shrink-0 ml-2 border-amber-500/40 text-amber-600">
                        {item.count}×
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
