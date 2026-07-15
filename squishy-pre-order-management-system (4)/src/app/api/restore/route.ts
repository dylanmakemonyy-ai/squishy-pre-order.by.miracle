import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, shipmentGroups } from "@/db/schema";
import { sql } from "drizzle-orm";

// Import data from JSON backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate backup format
    if (!body.version || !body.data) {
      return NextResponse.json(
        { error: "รูปแบบไฟล์ backup ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { orders: ordersData, shipmentGroups: shipmentGroupsData } = body.data;

    let importedOrders = 0;
    let importedShipments = 0;

    // Import shipment groups first (because orders reference them)
    if (shipmentGroupsData && shipmentGroupsData.length > 0) {
      for (const group of shipmentGroupsData) {
        await db.insert(shipmentGroups).values({
          name: group.name,
          trackingNumber: group.trackingNumber || null,
          status: group.status || "รอเข้าโกดัง",
          notes: group.notes || null,
        });
        importedShipments++;
      }
    }

    // Import orders
    if (ordersData && ordersData.length > 0) {
      for (const order of ordersData) {
        await db.insert(orders).values({
          customerName: order.customerName,
          productName: order.productName,
          quantity: order.quantity || 1,
          costPrice: order.costPrice || "0",
          sellingPrice: order.sellingPrice || "0",
          shippingCost: order.shippingCost || "0",
          status: order.status || "ยังไม่จ่าย",
          orderDate: order.orderDate || new Date().toISOString().split("T")[0],
          boxImage: order.boxImage || null,
          paymentSlip: order.paymentSlip || null,
          notes: order.notes || null,
          shipmentGroupId: null, // Reset shipment group reference
        });
        importedOrders++;
      }
    }

    return NextResponse.json({
      success: true,
      imported: {
        orders: importedOrders,
        shipmentGroups: importedShipments,
      },
    });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการนำเข้าข้อมูล" },
      { status: 500 }
    );
  }
}
