import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shipmentGroups, orders } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET() {
  // ดึงข้อมูลกลุ่มพัสดุพร้อมจำนวนออเดอร์
  const groups = await db
    .select({
      id: shipmentGroups.id,
      name: shipmentGroups.name,
      trackingNumber: shipmentGroups.trackingNumber,
      status: shipmentGroups.status,
      notes: shipmentGroups.notes,
      createdAt: shipmentGroups.createdAt,
      updatedAt: shipmentGroups.updatedAt,
      orderCount: sql<number>`count(${orders.id})::int`,
    })
    .from(shipmentGroups)
    .leftJoin(orders, eq(orders.shipmentGroupId, shipmentGroups.id))
    .groupBy(shipmentGroups.id)
    .orderBy(desc(shipmentGroups.createdAt));

  return NextResponse.json(groups);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const newGroup = await db
    .insert(shipmentGroups)
    .values({
      name: body.name || `กล่องพัสดุ ${new Date().toLocaleDateString("th-TH")}`,
      trackingNumber: body.trackingNumber || null,
      status: body.status || "รอเข้าโกดัง",
      notes: body.notes || null,
    })
    .returning();

  // ถ้ามี orderIds ให้เพิ่มออเดอร์เข้ากลุ่ม
  if (body.orderIds && body.orderIds.length > 0) {
    for (const orderId of body.orderIds) {
      await db
        .update(orders)
        .set({ shipmentGroupId: newGroup[0].id, updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    }
  }

  return NextResponse.json(newGroup[0], { status: 201 });
}
