import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shipmentGroups, orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // ดึงข้อมูลกลุ่มพัสดุ
  const group = await db
    .select()
    .from(shipmentGroups)
    .where(eq(shipmentGroups.id, parseInt(id)));

  if (group.length === 0) {
    return NextResponse.json({ error: "ไม่พบกลุ่มพัสดุ" }, { status: 404 });
  }

  // ดึงออเดอร์ในกลุ่ม
  const groupOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.shipmentGroupId, parseInt(id)));

  return NextResponse.json({
    ...group[0],
    orders: groupOrders,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updated = await db
    .update(shipmentGroups)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.trackingNumber !== undefined && { trackingNumber: body.trackingNumber }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
      updatedAt: new Date(),
    })
    .where(eq(shipmentGroups.id, parseInt(id)))
    .returning();

  if (updated.length === 0) {
    return NextResponse.json({ error: "ไม่พบกลุ่มพัสดุ" }, { status: 404 });
  }

  return NextResponse.json(updated[0]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // เอาออเดอร์ออกจากกลุ่มก่อน
  await db
    .update(orders)
    .set({ shipmentGroupId: null, updatedAt: new Date() })
    .where(eq(orders.shipmentGroupId, parseInt(id)));

  // ลบกลุ่ม
  const deleted = await db
    .delete(shipmentGroups)
    .where(eq(shipmentGroups.id, parseInt(id)))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json({ error: "ไม่พบกลุ่มพัสดุ" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
