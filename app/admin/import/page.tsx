import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function AdminImportPage() {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://mercatolist.vercel.app").replace(/\/$/, "");
  const token = process.env.ADMIN_IMPORT_TOKEN || "";
  const bookmarklet = `javascript:(function(){var s=document.createElement('script');s.src='${base}/import-bookmarklet.js?'+Date.now();document.body.appendChild(s);})();`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Listings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Grab a listing from another site (BizBuySell, East Coast Business Brokers, etc.) straight into MercatoList.
        </p>
      </div>

      {!token && (
        <Card className="border-amber-400/50 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-4 text-sm text-amber-900 dark:text-amber-200">
            <strong>Setup needed:</strong> set an <code>ADMIN_IMPORT_TOKEN</code> environment variable in Vercel
            (any long random string), then redeploy. The importer stays disabled until it&apos;s set.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">1. Add the bookmarklet</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Create a new browser bookmark, and paste this as its <strong>URL</strong>:</p>
          <textarea
            readOnly
            rows={3}
            className="w-full rounded-md border bg-muted/40 p-2 font-mono text-xs"
            value={bookmarklet}
          />
          <p className="text-muted-foreground">Name it something like &quot;Import to MercatoList&quot;.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">2. Your import token</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>The first time you run the bookmarklet it&apos;ll ask for your site URL and this token (stored after that):</p>
          <div className="rounded-md border bg-muted/40 p-2 font-mono text-xs break-all">
            {token ? token : "— set ADMIN_IMPORT_TOKEN first —"}
          </div>
          <p className="text-muted-foreground">Site URL to enter: <span className="font-mono">{base}</span></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">3. Import a listing</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Open a listing on the source site (log in there if needed).</li>
            <li>Click the <strong>Import to MercatoList</strong> bookmark.</li>
            <li>A panel appears — it auto-fills what it can. Review the fields, set the <strong>seller/advisor</strong> and <strong>category</strong>, then click <strong>Create listing</strong>.</li>
            <li>The listing publishes live immediately under that seller&apos;s account.</li>
          </ol>
          <div className="mt-3 rounded-md border bg-muted/30 p-3 text-muted-foreground">
            <strong>Photos:</strong> open sites (like East Coast) import automatically. <strong>BizBuySell</strong> blocks
            photo grabbing, so for those you&apos;ll add photos by hand afterward (edit the listing in Admin → Listings).
            All the text fields still auto-fill.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
