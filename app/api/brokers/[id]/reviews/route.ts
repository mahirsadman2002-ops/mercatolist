// Legacy alias: "brokers" were renamed "advisors" (the /brokers pages redirect
// to /advisors). Kept so old API callers work, but served by the one
// maintained handler so the two can't drift apart again — the old copy here
// returned raw review rows, including moderation fields, to anyone.
export { GET, POST } from "@/app/api/advisors/[id]/reviews/route";
