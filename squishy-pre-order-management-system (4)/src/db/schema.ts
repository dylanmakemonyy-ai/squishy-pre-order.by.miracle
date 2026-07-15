import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

// กลุ่มพัสดุ - รวมหลายออเดอร์เข้าด้วยกัน
export const shipmentGroups = pgTable("shipment_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // ชื่อกลุ่ม เช่น "กล่องที่ 1", "พัสดุ 15 ม.ค."
  trackingNumber: text("tracking_number"),
  // สถานะการจัดส่ง 5 ขั้น
  status: text("status").notNull().default("รอเข้าโกดัง"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ShipmentGroup = typeof shipmentGroups.$inferSelect;
export type NewShipmentGroup = typeof shipmentGroups.$inferInsert;

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  // ราคาที่สั่งจากจีน (ต้นทุน)
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }).default("0"),
  // เงินที่ได้จากลูกค้า
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).default("0"),
  // ค่าส่ง (ใส่ทีหลังได้)
  shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }).default("0"),
  // สถานะการชำระเงิน: ยังไม่จ่าย, จ่ายเงินแล้ว, สั่งแล้ว
  status: text("status").notNull().default("ยังไม่จ่าย"),
  // วันที่ออเดอร์ (เลือกได้ แก้ไขได้)
  orderDate: date("order_date").notNull(),
  // รูปหน้ากล่อง (เก็บเป็น base64 หรือ URL)
  boxImage: text("box_image"),
  // สลิปการโอนเงิน
  paymentSlip: text("payment_slip"),
  // หมายเหตุ
  notes: text("notes"),
  // กลุ่มพัสดุ (ถ้ามี)
  shipmentGroupId: integer("shipment_group_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
