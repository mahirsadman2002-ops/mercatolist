"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Mail, CheckCircle2, XCircle } from "lucide-react";

interface EmailLogRow {
  id: string;
  to: string;
  subject: string;
  template: string | null;
  status: "SENT" | "FAILED";
  error: string | null;
  resendId: string | null;
  createdAt: string;
}

interface Stats {
  sentToday: number;
  sentWeek: number;
  failedWeek: number;
}

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<EmailLogRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [templates, setTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("all");
  const [template, setTemplate] = useState("all");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        status,
        template,
      });
      if (qDebounced) params.set("q", qDebounced);
      const res = await fetch(`/api/admin/emails?${params.toString()}`);
      const d = await res.json();
      if (d.success) {
        setEmails(d.data);
        setStats(d.stats);
        setTemplates(d.templates);
        setTotalPages(d.pagination.totalPages);
        setTotal(d.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, status, template, qDebounced]);

  useEffect(() => {
    load();
  }, [load]);

  // Filters reset pagination.
  useEffect(() => {
    setPage(1);
  }, [status, template, qDebounced]);

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Emails</h1>
        <p className="text-sm text-muted-foreground">
          Every email the app has sent. Delivery, opens, and bounces live in the{" "}
          <a
            href="https://resend.com/emails"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Resend dashboard
          </a>
          .
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-8 w-8 text-teal-600" />
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats?.sentToday ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Sent · last 24h</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-8 w-8 text-teal-600" />
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats?.sentWeek ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Sent · last 7 days</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className={`h-8 w-8 ${stats?.failedWeek ? "text-red-500" : "text-muted-foreground"}`} />
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats?.failedWeek ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Failed · last 7 days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search recipient or subject…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-64"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={template} onValueChange={setTemplate}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All templates</SelectItem>
            {templates.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">
          {total} total
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : emails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No emails logged yet. Sends are recorded from the moment this
                    feature deployed — older sends are only in Resend.
                  </TableCell>
                </TableRow>
              ) : (
                emails.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-sm tabular-nums">
                      {fmtDate(e.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-sm">{e.to}</TableCell>
                    <TableCell className="max-w-80 truncate text-sm" title={e.subject}>
                      {e.subject}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.template || "—"}
                    </TableCell>
                    <TableCell>
                      {e.status === "SENT" ? (
                        <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100">Sent</Badge>
                      ) : (
                        <Badge
                          className="bg-red-100 text-red-700 hover:bg-red-100"
                          title={e.error || undefined}
                        >
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
