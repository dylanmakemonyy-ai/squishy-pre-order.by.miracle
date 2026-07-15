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
  boxImage: string | null;
  paymentSlip: string | null;
  notes: string | null;
  shipmentGroupId: number | null;
  createdAt: string;
  updatedAt: string;
}

const STATUSES = ["ยังไม่จ่าย", "จ่ายเงินแล้ว", "สั่งแล้ว"];

const STATUS_COLORS: Record<string, string> = {
  "ยังไม่จ่าย": "bg-red-100 text-red-700 border-red-300",
  "จ่ายเงินแล้ว": "bg-yellow-100 text-yellow-700 border-yellow-300",
  "สั่งแล้ว": "bg-green-100 text-green-700 border-green-300",
};

function formatNumber(val: string | number) {
  const num = typeof val === "string" ? parseFloat(val) : val;
  return num.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Order>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);
        setForm(data);
        setImagePreview(data.boxImage);
        setSlipPreview(data.paymentSlip);
      });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        boxImage: imagePreview,
        paymentSlip: slipPreview,
      }),
    });
    const updated = await res.json();
    setOrder(updated);
    setForm(updated);
    setImagePreview(updated.boxImage);
    setSlipPreview(updated.paymentSlip);
    setEditing(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("ต้องการลบออเดอร์นี้จริงหรือ?")) return;
    setDeleting(true);
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    router.push("/");
  }

  async function handleStatusChange(newStatus: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const updated = await res.json();
    setOrder(updated);
    setForm(updated);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("ไฟล์ใหญ่เกิน 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSlipUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("ไฟล์ใหญ่เกิน 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSlipPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  if (!order) {
    return (
      <div className="text-center py-20 text-gray-400">กำลังโหลด...</div>
    );
  }

  const profit =
    parseFloat(order.sellingPrice) -
    parseFloat(order.costPrice) -
    parseFloat(order.shippingCost);

  const currentStatusIdx = STATUSES.indexOf(order.status);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/")}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← กลับหน้าหลัก
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-sm text-gray-400">ออเดอร์ #{order.id}</span>
            <h1 className="text-xl font-bold mt-1">{order.customerName}</h1>
            {order.shipmentGroupId && (
              <a
                href={`/shipments/${order.shipmentGroupId}`}
                className="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
              >
                📦 ดูกลุ่มพัสดุ #{order.shipmentGroupId}
              </a>
            )}
          </div>
          <span
            className={`text-sm px-3 py-1 rounded-full font-medium border ${
              STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {/* Status Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">
          สถานะการชำระเงิน (กดเพื่อเปลี่ยน)
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s, i) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`text-xs px-4 py-2 rounded-lg border transition font-medium ${
                order.status === s
                  ? STATUS_COLORS[s]
                  : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Details / Edit */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">รายละเอียด</h2>
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
                  setForm(order);
                  setImagePreview(order.boxImage);
                  setSlipPreview(order.paymentSlip);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  ชื่อลูกค้า
                </label>
                <input
                  type="text"
                  value={form.customerName || ""}
                  onChange={(e) =>
                    setForm({ ...form, customerName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  วันที่
                </label>
                <input
                  type="date"
                  value={form.orderDate || ""}
                  onChange={(e) =>
                    setForm({ ...form, orderDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  ชื่อสินค้า / โมเดล
                </label>
                <input
                  type="text"
                  value={form.productName || ""}
                  onChange={(e) =>
                    setForm({ ...form, productName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  จำนวน
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity || 1}
                  onChange={(e) =>
                    setForm({ ...form, quantity: parseInt(e.target.value) || 1 })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  ราคาที่สั่ง (ต้นทุนจีน) ฿
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.costPrice || ""}
                  onChange={(e) =>
                    setForm({ ...form, costPrice: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  เงินที่ได้จากลูกค้า ฿
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.sellingPrice || ""}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  ค่าส่ง ฿ (ใส่ทีหลังได้)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.shippingCost || ""}
                  onChange={(e) =>
                    setForm({ ...form, shippingCost: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                หมายเหตุ
              </label>
              <textarea
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  📷 รูปหน้ากล่อง
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-sm"
                />
                {imagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={imagePreview}
                      alt="box"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  🧾 สลิปการโอนเงิน
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSlipUpload}
                  className="text-sm"
                />
                {slipPreview && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={slipPreview}
                      alt="slip"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => setSlipPreview(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">ชื่อลูกค้า</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">วันที่</p>
                <p className="font-medium">{order.orderDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">สินค้า</p>
                <p className="font-medium">{order.productName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">จำนวน</p>
                <p className="font-medium">{order.quantity} ชิ้น</p>
              </div>
            </div>

            {order.notes && (
              <div>
                <p className="text-xs text-gray-400">หมายเหตุ</p>
                <p className="text-sm mt-1">{order.notes}</p>
              </div>
            )}

            {/* Images Section */}
            {(order.boxImage || order.paymentSlip) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {order.boxImage && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">📷 รูปหน้ากล่อง</p>
                    <img
                      src={order.boxImage}
                      alt="box"
                      className="w-40 h-40 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                      onClick={() => window.open(order.boxImage!, "_blank")}
                    />
                  </div>
                )}
                {order.paymentSlip && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      🧾 สลิปการโอนเงิน
                    </p>
                    <img
                      src={order.paymentSlip}
                      alt="slip"
                      className="w-40 h-40 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                      onClick={() => window.open(order.paymentSlip!, "_blank")}
                    />
                    <p className="text-xs text-green-600 mt-1">
                      ✓ มีหลักฐานการโอนเงิน
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-4">สรุปการเงิน</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">เงินที่ได้จากลูกค้า</span>
            <span className="font-medium text-green-600">
              +฿{formatNumber(order.sellingPrice)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">ราคาสั่งจากจีน (ต้นทุน)</span>
            <span className="font-medium text-red-500">
              -฿{formatNumber(order.costPrice)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">
              ค่าส่ง{" "}
              {parseFloat(order.shippingCost) === 0 && (
                <span className="text-xs text-orange-500">(ยังไม่ระบุ)</span>
              )}
            </span>
            <span className="font-medium text-red-500">
              -฿{formatNumber(order.shippingCost)}
            </span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between text-base">
            <span className="font-semibold">กำไรสุทธิ</span>
            <span
              className={`font-bold text-lg ${
                profit >= 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              ฿{formatNumber(profit)}
            </span>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="text-xs text-gray-400 space-y-1">
        <p>สร้างเมื่อ: {new Date(order.createdAt).toLocaleString("th-TH")}</p>
        <p>
          แก้ไขล่าสุด: {new Date(order.updatedAt).toLocaleString("th-TH")}
        </p>
      </div>

      {/* Delete */}
      <div className="pt-4 border-t">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          {deleting ? "กำลังลบ..." : "🗑️ ลบออเดอร์นี้"}
        </button>
      </div>
    </div>
  );
}
