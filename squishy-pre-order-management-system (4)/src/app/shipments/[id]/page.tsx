"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

interface Order {
  id: number;
  customerName: string;
  productName: string;
  quantity: number;
  costPrice: string;
  sellingPrice: string;
  shippingCost: string;
  status: string;
  orderDate: string;
  shipmentGroupId: number | null;
}

interface ShipmentGroup {
  id: number;
  name: string;
  trackingNumber: string | null;
  status: string;
  notes: string | null;
  orders: Order[];
  createdAt: string;
  updatedAt: string;
}

const SHIPMENT_STATUSES = [
  "รอเข้าโกดัง",
  "เข้าโกดัง",
  "ออกโกดัง",
  "ถึงโกดังไทย",
  "ถึงแล้ว",
];

const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  "รอเข้าโกดัง": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "เข้าโกดัง": "bg-blue-100 text-blue-800 border-blue-300",
  "ออกโกดัง": "bg-purple-100 text-purple-800 border-purple-300",
  "ถึงโกดังไทย": "bg-orange-100 text-orange-800 border-orange-300",
  "ถึงแล้ว": "bg-green-100 text-green-800 border-green-300",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  "ยังไม่จ่าย": "bg-red-100 text-red-700",
  "จ่ายเงินแล้ว": "bg-yellow-100 text-yellow-700",
  "สั่งแล้ว": "bg-green-100 text-green-700",
};

function formatNumber(val: string | number) {
  const num = typeof val === "string" ? parseFloat(val) : val;
  return num.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<ShipmentGroup | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trackingNumber: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // สำหรับเพิ่มออเดอร์เข้ากลุ่ม
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [addingOrders, setAddingOrders] = useState(false);

  useEffect(() => {
    fetchGroup();
  }, [id]);

  async function fetchGroup() {
    const res = await fetch(`/api/shipments/${id}`);
    const data = await res.json();
    setGroup(data);
    setForm({
      name: data.name || "",
      trackingNumber: data.trackingNumber || "",
      notes: data.notes || "",
    });
  }

  async function fetchAvailableOrders() {
    // ดึงออเดอร์ที่ยังไม่ได้อยู่ในกลุ่มใดๆ
    const res = await fetch("/api/orders");
    const allOrders: Order[] = await res.json();
    const available = allOrders.filter((o) => o.shipmentGroupId === null);
    setAvailableOrders(available);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/shipments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const updated = await res.json();
    setGroup((prev) => (prev ? { ...prev, ...updated } : prev));
    setEditing(false);
    setSaving(false);
  }

  async function handleStatusChange(newStatus: string) {
    const res = await fetch(`/api/shipments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const updated = await res.json();
    setGroup((prev) => (prev ? { ...prev, ...updated } : prev));
  }

  async function handleRemoveOrder(orderId: number) {
    if (!confirm("ต้องการเอาออเดอร์นี้ออกจากกลุ่มหรือไม่?")) return;

    await fetch(`/api/shipments/${id}/orders`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds: [orderId] }),
    });

    setGroup((prev) =>
      prev
        ? {
            ...prev,
            orders: prev.orders.filter((o) => o.id !== orderId),
          }
        : prev
    );
  }

  async function handleAddOrders() {
    if (selectedOrderIds.length === 0) return;
    setAddingOrders(true);

    await fetch(`/api/shipments/${id}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds: selectedOrderIds }),
    });

    setSelectedOrderIds([]);
    setShowAddOrderModal(false);
    setAddingOrders(false);
    fetchGroup();
  }

  async function handleDelete() {
    if (!confirm("ต้องการลบกลุ่มพัสดุนี้จริงหรือ? (ออเดอร์จะไม่ถูกลบ)")) return;
    setDeleting(true);
    await fetch(`/api/shipments/${id}`, { method: "DELETE" });
    router.push("/");
  }

  function openAddOrderModal() {
    fetchAvailableOrders();
    setShowAddOrderModal(true);
  }

  function toggleOrderSelection(orderId: number) {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20 text-gray-400">กำลังโหลด...</div>
    );
  }

  const currentStatusIdx = SHIPMENT_STATUSES.indexOf(group.status);

  // Calculate totals
  const totalCost = group.orders.reduce(
    (sum, o) => sum + parseFloat(o.costPrice),
    0
  );
  const totalRevenue = group.orders.reduce(
    (sum, o) => sum + parseFloat(o.sellingPrice),
    0
  );
  const totalShipping = group.orders.reduce(
    (sum, o) => sum + parseFloat(o.shippingCost),
    0
  );
  const totalProfit = totalRevenue - totalCost - totalShipping;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/")}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← กลับหน้าหลัก
      </button>

      {/* Header with Big Tracking Number */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <span className="text-sm text-gray-400">กลุ่มพัสดุ #{group.id}</span>
            <h1 className="text-xl font-bold mt-1">{group.name}</h1>
            <span
              className={`inline-block mt-2 text-sm px-3 py-1 rounded-full font-medium border ${
                SHIPMENT_STATUS_COLORS[group.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {group.status}
            </span>
          </div>
        </div>

        {/* Big Tracking Number */}
        <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <p className="text-sm text-blue-600 mb-1">📦 เลขพัสดุ</p>
          {group.trackingNumber ? (
            <p className="text-2xl md:text-3xl font-bold font-mono text-blue-800 break-all">
              {group.trackingNumber}
            </p>
          ) : (
            <p className="text-lg text-gray-400">ยังไม่ระบุเลขพัสดุ</p>
          )}
        </div>
      </div>

      {/* Status Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">
          สถานะการจัดส่ง (กดเพื่อเปลี่ยน)
        </p>
        <div className="flex flex-wrap gap-2">
          {SHIPMENT_STATUSES.map((s, i) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`text-xs px-3 py-2 rounded-lg border transition font-medium ${
                i <= currentStatusIdx
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Edit Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">ข้อมูลกลุ่มพัสดุ</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ✏️ แก้ไข
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setForm({
                    name: group.name || "",
                    trackingNumber: group.trackingNumber || "",
                    notes: group.notes || "",
                  });
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "💾 บันทึก"}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                ชื่อกลุ่มพัสดุ
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                เลข Tracking
              </label>
              <input
                type="text"
                value={form.trackingNumber}
                onChange={(e) =>
                  setForm({ ...form, trackingNumber: e.target.value })
                }
                placeholder="เลขพัสดุจากจีน"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                หมายเหตุ
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ชื่อกลุ่ม</span>
              <span className="font-medium">{group.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">เลข Tracking</span>
              <span className="font-medium font-mono">
                {group.trackingNumber || "-"}
              </span>
            </div>
            {group.notes && (
              <div className="flex justify-between">
                <span className="text-gray-500">หมายเหตุ</span>
                <span className="font-medium">{group.notes}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-4">สรุปยอดกลุ่มพัสดุนี้</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">จำนวนออเดอร์</p>
            <p className="text-xl font-bold">{group.orders.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">ต้นทุนรวม</p>
            <p className="text-xl font-bold text-red-500">
              ฿{formatNumber(totalCost + totalShipping)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">รายรับรวม</p>
            <p className="text-xl font-bold text-green-600">
              ฿{formatNumber(totalRevenue)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">กำไรรวม</p>
            <p
              className={`text-xl font-bold ${
                totalProfit >= 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              ฿{formatNumber(totalProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* Orders in this group */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">
            ออเดอร์ในกลุ่มนี้ ({group.orders.length})
          </h2>
          <button
            onClick={openAddOrderModal}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
          >
            + เพิ่มออเดอร์
          </button>
        </div>

        {group.orders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📦</p>
            <p>ยังไม่มีออเดอร์ในกลุ่มนี้</p>
            <button
              onClick={openAddOrderModal}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              + เพิ่มออเดอร์เข้ากลุ่ม
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {group.orders.map((order) => {
              const profit =
                parseFloat(order.sellingPrice) -
                parseFloat(order.costPrice) -
                parseFloat(order.shippingCost);

              return (
                <div
                  key={order.id}
                  className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <a
                      href={`/orders/${order.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-400">#{order.id}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            ORDER_STATUS_COLORS[order.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="font-medium text-sm truncate mt-1">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {order.productName} x{order.quantity}
                      </p>
                    </a>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-bold ${
                          profit >= 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        ฿{formatNumber(profit)}
                      </p>
                      <button
                        onClick={() => handleRemoveOrder(order.id)}
                        className="text-xs text-red-500 hover:text-red-700 mt-1"
                      >
                        เอาออก
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Timestamps */}
      <div className="text-xs text-gray-400 space-y-1">
        <p>สร้างเมื่อ: {new Date(group.createdAt).toLocaleString("th-TH")}</p>
        <p>
          แก้ไขล่าสุด: {new Date(group.updatedAt).toLocaleString("th-TH")}
        </p>
      </div>

      {/* Delete */}
      <div className="pt-4 border-t">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          {deleting ? "กำลังลบ..." : "🗑️ ลบกลุ่มพัสดุนี้"}
        </button>
      </div>

      {/* Add Order Modal */}
      {showAddOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold mb-4">
              เพิ่มออเดอร์เข้ากลุ่มพัสดุ
            </h3>

            <div className="flex-1 overflow-y-auto">
              {availableOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>ไม่มีออเดอร์ที่พร้อมเพิ่มเข้ากลุ่ม</p>
                  <p className="text-xs mt-1">
                    (ออเดอร์ทั้งหมดอยู่ในกลุ่มอื่นแล้ว)
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-3">
                    เลือกออเดอร์ที่ต้องการเพิ่ม ({availableOrders.length} รายการ)
                  </p>
                  {availableOrders.map((order) => {
                    const isSelected = selectedOrderIds.includes(order.id);
                    return (
                      <div
                        key={order.id}
                        onClick={() => toggleOrderSelection(order.id)}
                        className={`border rounded-lg p-3 cursor-pointer transition ${
                          isSelected
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                #{order.id}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  ORDER_STATUS_COLORS[order.status] ||
                                  "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <p className="font-medium text-sm truncate">
                              {order.customerName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {order.productName} x{order.quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  setShowAddOrderModal(false);
                  setSelectedOrderIds([]);
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddOrders}
                disabled={selectedOrderIds.length === 0 || addingOrders}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {addingOrders
                  ? "กำลังเพิ่ม..."
                  : `เพิ่ม ${selectedOrderIds.length} ออเดอร์`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
