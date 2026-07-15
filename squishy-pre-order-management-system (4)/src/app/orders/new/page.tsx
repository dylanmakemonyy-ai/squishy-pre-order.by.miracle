"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    customerName: "",
    productName: "",
    quantity: 1,
    costPrice: "",
    sellingPrice: "",
    shippingCost: "",
    status: "ยังไม่จ่าย",
    orderDate: today,
    boxImage: null as string | null,
    paymentSlip: null as string | null,
    notes: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("ไฟล์ใหญ่เกิน 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setForm({ ...form, boxImage: result });
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
      const result = reader.result as string;
      setSlipPreview(result);
      setForm({ ...form, paymentSlip: result });
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName.trim() || !form.productName.trim()) {
      alert("กรุณาใส่ชื่อลูกค้าและชื่อสินค้า");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        costPrice: form.costPrice || "0",
        sellingPrice: form.sellingPrice || "0",
        shippingCost: form.shippingCost || "0",
      }),
    });

    if (res.ok) {
      const newOrder = await res.json();
      router.push(`/orders/${newOrder.id}`);
    } else {
      alert("เกิดข้อผิดพลาดในการบันทึก");
      setSaving(false);
    }
  }

  // Profit calculation
  const costPrice = parseFloat(form.costPrice) || 0;
  const sellingPrice = parseFloat(form.sellingPrice) || 0;
  const shippingCost = parseFloat(form.shippingCost) || 0;
  const profit = sellingPrice - costPrice - shippingCost;

  function formatNumber(val: number) {
    return val.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.push("/")}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        ← กลับหน้าหลัก
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h1 className="text-xl font-bold mb-6">เพิ่มออเดอร์ใหม่</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                ชื่อลูกค้า *
              </label>
              <input
                type="text"
                required
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                placeholder="ชื่อลูกค้า"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                วันที่ออเดอร์
              </label>
              <input
                type="date"
                value={form.orderDate}
                onChange={(e) =>
                  setForm({ ...form, orderDate: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                ชื่อสินค้า / โมเดล *
              </label>
              <input
                type="text"
                required
                value={form.productName}
                onChange={(e) =>
                  setForm({ ...form, productName: e.target.value })
                }
                placeholder="เช่น สกุชชี่ขนมปัง, แมวน้ำ"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                จำนวน (ชิ้น)
              </label>
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              💰 ข้อมูลราคา
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  ราคาสั่ง (ต้นทุนจีน) ฿
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.costPrice}
                  onChange={(e) =>
                    setForm({ ...form, costPrice: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  เงินจากลูกค้า ฿
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
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
                  value={form.shippingCost}
                  onChange={(e) =>
                    setForm({ ...form, shippingCost: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

            {/* Profit preview */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">กำไรโดยประมาณ</span>
                <span
                  className={`font-bold ${
                    profit >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  ฿{formatNumber(profit)}
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              สถานะการชำระเงิน
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "ยังไม่จ่าย", color: "bg-red-100 text-red-700 border-red-300" },
                { value: "จ่ายเงินแล้ว", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
                { value: "สั่งแล้ว", color: "bg-green-100 text-green-700 border-green-300" },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm({ ...form, status: s.value })}
                  className={`text-xs px-4 py-2 rounded-lg border transition font-medium ${
                    form.status === s.value
                      ? s.color
                      : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {s.value}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              หมายเหตุ
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="หมายเหตุเพิ่มเติม..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                📷 รูปหน้ากล่อง (ไม่เกิน 5MB)
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
                    alt="preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setForm({ ...form, boxImage: null });
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                🧾 สลิปการโอนเงิน (ไม่เกิน 5MB)
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
                    alt="slip preview"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSlipPreview(null);
                      setForm({ ...form, paymentSlip: null });
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-gray-700 transition disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : "✅ บันทึกออเดอร์"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-gray-500 px-6 py-2.5 rounded-lg text-sm border border-gray-300 hover:bg-gray-50 transition"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
