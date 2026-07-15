"use client";

import { useState, useRef } from "react";

interface BackupData {
  version: string;
  exportedAt: string;
  data: {
    orders: unknown[];
    shipmentGroups: unknown[];
  };
  summary: {
    totalOrders: number;
    totalShipmentGroups: number;
  };
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previewData, setPreviewData] = useState<BackupData | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download backup
  async function handleBackup() {
    setLoading(true);
    setMessage(null);
    try {
      window.location.href = "/api/backup";
      setMessage({ type: "success", text: "กำลังดาวน์โหลดไฟล์ backup..." });
    } catch {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการ backup" });
    }
    setLoading(false);
  }

  // Handle file selection for restore
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as BackupData;
        if (!data.version || !data.data) {
          setMessage({ type: "error", text: "รูปแบบไฟล์ไม่ถูกต้อง" });
          return;
        }
        setPreviewData(data);
        setMessage(null);
      } catch {
        setMessage({ type: "error", text: "ไม่สามารถอ่านไฟล์ได้" });
      }
    };
    reader.readAsText(file);
  }

  // Restore data
  async function handleRestore() {
    if (!previewData) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(previewData),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: `นำเข้าสำเร็จ! ออเดอร์ ${result.imported.orders} รายการ, กลุ่มพัสดุ ${result.imported.shipmentGroups} รายการ`,
        });
        setPreviewData(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        setMessage({ type: "error", text: result.error || "เกิดข้อผิดพลาด" });
      }
    } catch {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการนำเข้าข้อมูล" });
    }

    setLoading(false);
  }

  // Clear all data
  async function handleClearData() {
    if (clearConfirmText !== "ลบทัังหมด") {
      setMessage({ type: "error", text: "กรุณาพิมพ์ 'ลบทัังหมด' เพื่อยืนยัน" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/clear", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE_ALL_DATA" }),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "ลบข้อมูลทั้งหมดเรียบร้อยแล้ว" });
        setShowClearConfirm(false);
        setClearConfirmText("");
      } else {
        setMessage({ type: "error", text: result.error || "เกิดข้อผิดพลาด" });
      }
    } catch {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการลบข้อมูล" });
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">⚙️ ตั้งค่า</h1>
        <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← กลับหน้าหลัก
        </a>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Backup Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-2">💾 สำรองข้อมูล (Backup)</h2>
        <p className="text-sm text-gray-500 mb-4">
          ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ JSON เพื่อเก็บไว้ในเครื่อง
        </p>
        <button
          onClick={handleBackup}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "กำลังดำเนินการ..." : "📥 ดาวน์โหลด Backup"}
        </button>
      </div>

      {/* Restore Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-2">📤 นำเข้าข้อมูล (Restore)</h2>
        <p className="text-sm text-gray-500 mb-4">
          นำเข้าข้อมูลจากไฟล์ backup ที่เคยดาวน์โหลดไว้
        </p>

        <input
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          ref={fileInputRef}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />

        {/* Preview */}
        {previewData && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-sm mb-2">📋 ข้อมูลที่จะนำเข้า:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📅 สำรองเมื่อ: {new Date(previewData.exportedAt).toLocaleString("th-TH")}</p>
              <p>📦 ออเดอร์: {previewData.summary.totalOrders} รายการ</p>
              <p>🚚 กลุ่มพัสดุ: {previewData.summary.totalShipmentGroups} รายการ</p>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleRestore}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? "กำลังนำเข้า..." : "✅ นำเข้าข้อมูล"}
              </button>
              <button
                onClick={() => {
                  setPreviewData(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
            </div>

            <p className="text-xs text-orange-600 mt-3">
              ⚠️ ข้อมูลจะถูกเพิ่มเข้าไป ไม่ได้ลบข้อมูลเดิม
            </p>
          </div>
        )}
      </div>

      {/* Clear Data Section */}
      <div className="bg-white rounded-xl border border-red-200 p-5">
        <h2 className="font-semibold mb-2 text-red-600">🗑️ ลบข้อมูลทั้งหมด</h2>
        <p className="text-sm text-gray-500 mb-4">
          ลบออเดอร์และกลุ่มพัสดุทั้งหมด (ไม่สามารถกู้คืนได้!)
        </p>

        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-200 transition"
          >
            ลบข้อมูลทั้งหมด
          </button>
        ) : (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700 mb-3">
              ⚠️ <strong>คำเตือน!</strong> การลบข้อมูลไม่สามารถกู้คืนได้ 
              กรุณา backup ข้อมูลก่อนลบ
            </p>
            <p className="text-sm text-gray-600 mb-2">
              พิมพ์ <strong>&quot;ลบทัังหมด&quot;</strong> เพื่อยืนยัน:
            </p>
            <input
              type="text"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              placeholder="พิมพ์ที่นี่..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={handleClearData}
                disabled={loading || clearConfirmText !== "ลบทัังหมด"}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? "กำลังลบ..." : "🗑️ ยืนยันลบทั้งหมด"}
              </button>
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearConfirmText("");
                }}
                className="px-4 py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
        <h2 className="font-semibold mb-2 text-blue-700">💡 เคล็ดลับ</h2>
        <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
          <li>ควร backup ข้อมูลเป็นประจำ เช่น ทุกสัปดาห์</li>
          <li>เก็บไฟล์ backup ไว้หลายที่ เช่น Google Drive, แฟลชไดรฟ์</li>
          <li>ก่อนลบข้อมูลทั้งหมด อย่าลืม backup ก่อนเสมอ</li>
          <li>ไฟล์ backup เป็น JSON สามารถเปิดดูด้วย Notepad ได้</li>
        </ul>
      </div>
    </div>
  );
}
