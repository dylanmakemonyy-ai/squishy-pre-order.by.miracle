"use client";

import { useState } from "react";

export default function CalculatorPage() {
  const [exchangeRate, setExchangeRate] = useState(5.0); // อัตราแลกเปลี่ยน หยวน → บาท
  const [yuan, setYuan] = useState("");
  const [baht, setBaht] = useState("");
  const [mode, setMode] = useState<"yuan_to_baht" | "baht_to_yuan">("yuan_to_baht");

  // Markup/margin calculator
  const [costPrice, setCostPrice] = useState("");
  const [marginPercent, setMarginPercent] = useState("30");
  const [shippingEstimate, setShippingEstimate] = useState("");

  function handleYuanChange(value: string) {
    setYuan(value);
    if (value && !isNaN(parseFloat(value))) {
      setBaht((parseFloat(value) * exchangeRate).toFixed(2));
    } else {
      setBaht("");
    }
  }

  function handleBahtChange(value: string) {
    setBaht(value);
    if (value && !isNaN(parseFloat(value))) {
      setYuan((parseFloat(value) / exchangeRate).toFixed(2));
    } else {
      setYuan("");
    }
  }

  function handleRateChange(value: string) {
    const rate = parseFloat(value) || 0;
    setExchangeRate(rate);
    if (mode === "yuan_to_baht" && yuan) {
      setBaht((parseFloat(yuan) * rate).toFixed(2));
    } else if (mode === "baht_to_yuan" && baht) {
      setYuan((parseFloat(baht) / rate).toFixed(2));
    }
  }

  // Calculate selling price
  const costInBaht = costPrice ? parseFloat(costPrice) * exchangeRate : 0;
  const shippingCost = shippingEstimate ? parseFloat(shippingEstimate) : 0;
  const totalCost = costInBaht + shippingCost;
  const margin = parseFloat(marginPercent) || 0;
  const sellingPrice = totalCost * (1 + margin / 100);
  const profit = sellingPrice - totalCost;

  function formatNumber(val: number) {
    return val.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">💱 เครื่องคิดเลข</h1>
        <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← กลับหน้าหลัก
        </a>
      </div>

      {/* Exchange Rate Setting */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-4">อัตราแลกเปลี่ยน</h2>
        <div className="flex items-center gap-3">
          <span className="text-lg">1 ¥ =</span>
          <input
            type="number"
            step="0.01"
            min={0}
            value={exchangeRate}
            onChange={(e) => handleRateChange(e.target.value)}
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-lg font-bold text-center"
          />
          <span className="text-lg">฿</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          * ปรับอัตราแลกเปลี่ยนตามจริงได้
        </p>
      </div>

      {/* Currency Converter */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-4">แปลงสกุลเงิน</h2>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("yuan_to_baht")}
            className={`flex-1 text-sm py-2 rounded-lg border transition ${
              mode === "yuan_to_baht"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            หยวน → บาท
          </button>
          <button
            onClick={() => setMode("baht_to_yuan")}
            className={`flex-1 text-sm py-2 rounded-lg border transition ${
              mode === "baht_to_yuan"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300"
            }`}
          >
            บาท → หยวน
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              หยวน (¥)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={yuan}
              onChange={(e) => {
                setMode("yuan_to_baht");
                handleYuanChange(e.target.value);
              }}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-xl font-mono"
            />
          </div>

          <div className="text-center text-2xl text-gray-400">↕</div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              บาท (฿)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={baht}
              onChange={(e) => {
                setMode("baht_to_yuan");
                handleBahtChange(e.target.value);
              }}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-xl font-mono"
            />
          </div>
        </div>
      </div>

      {/* Profit Calculator */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-4">คำนวณราคาขาย + กำไร</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              ราคาต้นทุน (หยวน ¥)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            {costPrice && (
              <p className="text-xs text-gray-400 mt-1">
                = ฿{formatNumber(costInBaht)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              ค่าส่งโดยประมาณ (บาท ฿)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              value={shippingEstimate}
              onChange={(e) => setShippingEstimate(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              กำไรที่ต้องการ (%)
            </label>
            <div className="flex gap-2">
              {["20", "30", "40", "50"].map((p) => (
                <button
                  key={p}
                  onClick={() => setMarginPercent(p)}
                  className={`flex-1 text-sm py-2 rounded-lg border transition ${
                    marginPercent === p
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
            <input
              type="number"
              step="1"
              min={0}
              value={marginPercent}
              onChange={(e) => setMarginPercent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-2"
              placeholder="กำหนดเอง"
            />
          </div>

          {/* Results */}
          {costPrice && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ต้นทุนสินค้า (บาท)</span>
                <span>฿{formatNumber(costInBaht)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ค่าส่งโดยประมาณ</span>
                <span>฿{formatNumber(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ต้นทุนรวม</span>
                <span className="font-medium">฿{formatNumber(totalCost)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">ราคาขายแนะนำ</span>
                <span className="text-xl font-bold text-blue-600">
                  ฿{formatNumber(sellingPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">กำไรที่ได้</span>
                <span className="text-lg font-bold text-green-600">
                  +฿{formatNumber(profit)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Reference */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-4">ตารางแปลงเร็ว</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[10, 20, 50, 100, 200, 500, 1000].map((y) => (
            <div
              key={y}
              className="flex justify-between bg-gray-50 rounded-lg px-3 py-2"
            >
              <span className="text-gray-600">¥{y}</span>
              <span className="font-medium">฿{formatNumber(y * exchangeRate)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
