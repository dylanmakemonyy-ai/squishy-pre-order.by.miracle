import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, shipmentGroups } from "@/db/schema";
import { desc } from "drizzle-orm";

// Export all data as JSON
export async function GET() {
  const allOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.id));

  const allShipments = await db
    .select()
    .from(shipmentGroups)
    .orderBy(desc(shipmentGroups.id));

  const backupData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    data: {
      orders: allOrders,
      shipmentGroups: allShipments,
    },
    summary: {
      totalOrders: allOrders.length,
      totalShipmentGroups: allShipments.length,
    },
  };

  return new NextResponse(JSON.stringify(backupData, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="squishy_backup_${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
