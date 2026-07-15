import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc, eq, gte, lte, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const search = searchParams.get("search");

  const conditions = [];

  if (status && status !== "ทั้งหมด") {
    conditions.push(eq(orders.status, status));
  }
  if (dateFrom) {
    conditions.push(gte(orders.orderDate, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(orders.orderDate, dateTo));
  }
  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      sql`(${orders.customerName} ILIKE ${searchTerm} OR ${orders.productName} ILIKE ${searchTerm})`
    );
  }

  const result =
    conditions.length > 0
      ? await db
          .select()
          .from(orders)
          .where(and(...conditions))
          .orderBy(desc(orders.orderDate), desc(orders.id))
      : await db
          .select()
          .from(orders)
          .orderBy(desc(orders.orderDate), desc(orders.id));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const newOrder = await db
    .insert(orders)
    .values({
      customerName: body.customerName,
      productName: body.productName,
      quantity: body.quantity || 1,
      costPrice: body.costPrice || "0",
      sellingPrice: body.sellingPrice || "0",
      shippingCost: body.shippingCost || "0",
      status: body.status || "ยังไม่จ่าย",
      orderDate: body.orderDate || new Date().toISOString().split("T")[0],
      boxImage: body.boxImage || null,
      paymentSlip: body.paymentSlip || null,
      notes: body.notes || null,
      shipmentGroupId: body.shipmentGroupId || null,
    })
    .returning();

  return NextResponse.json(newOrder[0], { status: 201 });
}
