import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Простой healthcheck endpoint
  return json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};
