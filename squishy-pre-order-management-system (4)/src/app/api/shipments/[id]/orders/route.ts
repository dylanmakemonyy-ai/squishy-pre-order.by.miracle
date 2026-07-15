import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

// เพิ่มออเดอร์เข้ากลุ่ม
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (!body.orderIds || body.orderIds.length === 0) {
    return NextResponse.json({ error: "ต้องระบุ orderIds" }, { status: 400 });
  }

  await db
    .update(orders)
    .set({ shipmentGroupId: parseInt(id), updatedAt: new Date() })
    .where(inArray(orders.id, body.orderIds));

  return NextResponse.json({ success: true });
}

// เอาออเดอร์ออกจากกลุ่ม
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (!body.orderIds || body.orderIds.length === 0) {
    return NextResponse.json({ error: "ต้องระบุ orderIds" }, { status: 400 });
  }

  // เช็คว่าออเดอร์อยู่ในกลุ่มนี้จริง แล้วเอาออก
  await db
    .update(orders)
    .set({ shipmentGroupId: null, updatedAt: new Date() })
    .where(inArray(orders.id, body.orderIds));

  return NextResponse.json({ success: true });
}
