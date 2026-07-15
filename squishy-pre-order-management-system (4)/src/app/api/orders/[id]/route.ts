import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.id, parseInt(id)));

  if (result.length === 0) {
    return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updated = await db
    .update(orders)
    .set({
      ...(body.customerName !== undefined && {
        customerName: body.customerName,
      }),
      ...(body.productName !== undefined && { productName: body.productName }),
      ...(body.quantity !== undefined && { quantity: body.quantity }),
      ...(body.costPrice !== undefined && { costPrice: body.costPrice }),
      ...(body.sellingPrice !== undefined && {
        sellingPrice: body.sellingPrice,
      }),
      ...(body.shippingCost !== undefined && {
        shippingCost: body.shippingCost,
      }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.orderDate !== undefined && { orderDate: body.orderDate }),
      ...(body.boxImage !== undefined && { boxImage: body.boxImage }),
      ...(body.paymentSlip !== undefined && { paymentSlip: body.paymentSlip }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.shipmentGroupId !== undefined && { shipmentGroupId: body.shipmentGroupId }),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, parseInt(id)))
    .returning();

  if (updated.length === 0) {
    return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
  }

  return NextResponse.json(updated[0]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await db
    .delete(orders)
    .where(eq(orders.id, parseInt(id)))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
