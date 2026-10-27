export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ok: true,
    service: "vx-premium",
    storage: "netlify-blobs",
    timestamp: new Date().toISOString(),
  });
}
