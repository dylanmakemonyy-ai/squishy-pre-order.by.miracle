import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { sql, gte, lte, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const conditions = [];
  if (dateFrom) {
    conditions.push(gte(orders.orderDate, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(orders.orderDate, dateTo));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      totalOrders: sql<number>`count(*)::int`,
      totalRevenue: sql<string>`coalesce(sum(${orders.sellingPrice}::numeric), 0)`,
      totalCost: sql<string>`coalesce(sum(${orders.costPrice}::numeric), 0)`,
      totalShipping: sql<string>`coalesce(sum(${orders.shippingCost}::numeric), 0)`,
      totalProfit: sql<string>`coalesce(sum(${orders.sellingPrice}::numeric - ${orders.costPrice}::numeric - ${orders.shippingCost}::numeric), 0)`,
    })
    .from(orders)
    .where(whereClause);

  // Status counts
  const statusCounts = await db
    .select({
      status: orders.status,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(whereClause)
    .groupBy(orders.status);

  return NextResponse.json({
    ...result[0],
    statusCounts: statusCounts,
  });
}
