import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { sql, gte, lte, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get("period") || "week"; // week, month, year

  const today = new Date();
  let dateFrom: Date;
  let groupBy: string;

  switch (period) {
    case "week":
      dateFrom = new Date(today);
      dateFrom.setDate(today.getDate() - 6);
      groupBy = "day";
      break;
    case "month":
      dateFrom = new Date(today);
      dateFrom.setDate(today.getDate() - 29);
      groupBy = "day";
      break;
    case "year":
      dateFrom = new Date(today);
      dateFrom.setMonth(today.getMonth() - 11);
      groupBy = "month";
      break;
    default:
      dateFrom = new Date(today);
      dateFrom.setDate(today.getDate() - 6);
      groupBy = "day";
  }

  const dateFromStr = dateFrom.toISOString().split("T")[0];
  const dateToStr = today.toISOString().split("T")[0];

  // Get daily/monthly data
  let chartData;
  
  if (groupBy === "day") {
    chartData = await db
      .select({
        date: orders.orderDate,
        orderCount: sql<number>`count(*)::int`,
        revenue: sql<string>`coalesce(sum(${orders.sellingPrice}::numeric), 0)`,
        cost: sql<string>`coalesce(sum(${orders.costPrice}::numeric), 0)`,
        shipping: sql<string>`coalesce(sum(${orders.shippingCost}::numeric), 0)`,
        profit: sql<string>`coalesce(sum(${orders.sellingPrice}::numeric - ${orders.costPrice}::numeric - ${orders.shippingCost}::numeric), 0)`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.orderDate, dateFromStr),
          lte(orders.orderDate, dateToStr)
        )
      )
      .groupBy(orders.orderDate)
      .orderBy(orders.orderDate);
  } else {
    // Group by month
    chartData = await db
      .select({
        date: sql<string>`to_char(${orders.orderDate}, 'YYYY-MM')`,
        orderCount: sql<number>`count(*)::int`,
        revenue: sql<string>`coalesce(sum(${orders.sellingPrice}::numeric), 0)`,
        cost: sql<string>`coalesce(sum(${orders.costPrice}::numeric), 0)`,
        shipping: sql<string>`coalesce(sum(${orders.shippingCost}::numeric), 0)`,
        profit: sql<string>`coalesce(sum(${orders.sellingPrice}::numeric - ${orders.costPrice}::numeric - ${orders.shippingCost}::numeric), 0)`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.orderDate, dateFromStr),
          lte(orders.orderDate, dateToStr)
        )
      )
      .groupBy(sql`to_char(${orders.orderDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${orders.orderDate}, 'YYYY-MM')`);
  }

  // Fill missing dates with zero values
  const filledData = [];
  const currentDate = new Date(dateFrom);
  
  if (groupBy === "day") {
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const existing = chartData.find((d) => d.date === dateStr);
      filledData.push({
        date: dateStr,
        orderCount: existing?.orderCount || 0,
        revenue: existing?.revenue || "0",
        cost: existing?.cost || "0",
        shipping: existing?.shipping || "0",
        profit: existing?.profit || "0",
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else {
    // Fill months
    while (currentDate <= today) {
      const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
      const existing = chartData.find((d) => d.date === monthStr);
      filledData.push({
        date: monthStr,
        orderCount: existing?.orderCount || 0,
        revenue: existing?.revenue || "0",
        cost: existing?.cost || "0",
        shipping: existing?.shipping || "0",
        profit: existing?.profit || "0",
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return NextResponse.json({
    period,
    groupBy,
    data: filledData,
  });
}
