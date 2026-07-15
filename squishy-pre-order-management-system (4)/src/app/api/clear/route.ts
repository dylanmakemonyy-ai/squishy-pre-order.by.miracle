import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, shipmentGroups } from "@/db/schema";

// Clear all data (dangerous!)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    // Require confirmation
    if (body.confirm !== "DELETE_ALL_DATA") {
      return NextResponse.json(
        { error: "ต้องยืนยันการลบข้อมูล" },
        { status: 400 }
      );
    }

    // Delete all orders first (because of foreign key)
    await db.delete(orders);
    
    // Delete all shipment groups
    await db.delete(shipmentGroups);

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลทั้งหมดเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Clear error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบข้อมูล" },
      { status: 500 }
    );
  }
}
