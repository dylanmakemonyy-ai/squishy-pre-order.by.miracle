import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc, eq, gte, lte, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const status = searchParams.get("status");

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

  // Create CSV content
  const headers = [
    "เลขออเดอร์",
    "วันที่",
    "ชื่อลูกค้า",
    "สินค้า",
    "จำนวน",
    "ราคาต้นทุน",
    "ราคาขาย",
    "ค่าส่ง",
    "กำไร",
    "สถานะ",
    "หมายเหตุ",
  ];

  const rows = result.map((order) => {
    const profit =
      parseFloat(order.sellingPrice || "0") -
      parseFloat(order.costPrice || "0") -
      parseFloat(order.shippingCost || "0");

    return [
      order.id,
      order.orderDate,
      order.customerName,
      order.productName,
      order.quantity,
      order.costPrice,
      order.sellingPrice,
      order.shippingCost,
      profit.toFixed(2),
      order.status,
      order.notes || "",
    ];
  });

  // Calculate totals
  const totalCost = result.reduce(
    (sum, o) => sum + parseFloat(o.costPrice || "0"),
    0
  );
  const totalRevenue = result.reduce(
    (sum, o) => sum + parseFloat(o.sellingPrice || "0"),
    0
  );
  const totalShipping = result.reduce(
    (sum, o) => sum + parseFloat(o.shippingCost || "0"),
    0
  );
  const totalProfit = totalRevenue - totalCost - totalShipping;

  // Add summary row
  rows.push([]);
  rows.push(["สรุป", "", "", "", "", "", "", "", "", "", ""]);
  rows.push(["จำนวนออเดอร์", result.length, "", "", "", "", "", "", "", "", ""]);
  rows.push(["รายรับรวม", totalRevenue.toFixed(2), "", "", "", "", "", "", "", "", ""]);
  rows.push(["ต้นทุนรวม", totalCost.toFixed(2), "", "", "", "", "", "", "", "", ""]);
  rows.push(["ค่าส่งรวม", totalShipping.toFixed(2), "", "", "", "", "", "", "", "", ""]);
  rows.push(["กำไรสุทธิ", totalProfit.toFixed(2), "", "", "", "", "", "", "", "", ""]);

  // Convert to CSV
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell);
          // Escape quotes and wrap in quotes if contains comma
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(",")
    ),
  ].join("\n");

  // Add BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  const csvWithBom = bom + csvContent;

  return new NextResponse(csvWithBom, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
