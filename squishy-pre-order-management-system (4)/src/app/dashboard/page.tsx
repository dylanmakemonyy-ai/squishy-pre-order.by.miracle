"use client";

import { useEffect, useState, useCallback } from "react";

interface ChartData {
  date: string;
  orderCount: number;
  revenue: string;
  cost: string;
  shipping: string;
  profit: string;
}

interface ChartResponse {
  period: string;
  groupBy: string;
  data: ChartData[];
}

interface Summary {
  totalOrders: number;
  totalRevenue: string;
  totalCost: string;
  totalShipping: string;
  totalProfit: string;
  statusCounts: { status: string; count: number }[];
}

function formatNumber(val: string | number) {
  const num = typeof val === "string" ? parseFloat(val) : val;
  return num.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatShortDate(dateStr: string) {
  if (dateStr.length === 7) {
    // YYYY-MM format
    const [year, month] = dateStr.split("-");
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return months[parseInt(month) - 1];
  }
  const date = new Date(dateStr);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [chartRes, summaryRes] = await Promise.all([
      fetch(`/api/orders/chart?period=${period}`),
      fetch("/api/orders/summary"),
    ]);
    const chartJson: ChartResponse = await chartRes.json();
    setChartData(chartJson.data);
    setSummary(await summaryRes.json());
    setLoading(false);
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate max values for chart scaling
  const maxRevenue = Math.max(...chartData.map((d) => parseFloat(d.revenue) || 0), 1);
  const maxProfit = Math.max(...chartData.map((d) => Math.abs(parseFloat(d.profit)) || 0), 1);

  // Total for selected period
  const periodTotalRevenue = chartData.reduce((sum, d) => sum + parseFloat(d.revenue), 0);
  const periodTotalProfit = chartData.reduce((sum, d) => sum + parseFloat(d.profit), 0);
  const periodTotalOrders = chartData.reduce((sum, d) => sum + d.orderCount, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">📊 Dashboard</h1>
        <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← กลับหน้าหลัก
        </a>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500">ออเดอร์ทั้งหมด</p>
            <p className="text-2xl font-bold mt-1">{summary.totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500">รายรับรวม</p>
            <p className="text-2xl font-bold mt-1 text-green-600">
              ฿{formatNumber(summary.totalRevenue)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500">รายจ่ายรวม</p>
            <p className="text-2xl font-bold mt-1 text-red-500">
              ฿{formatNumber(parseFloat(summary.totalCost) + parseFloat(summary.totalShipping))}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs text-gray-500">กำไรสุทธิ</p>
            <p className={`text-2xl font-bold mt-1 ${parseFloat(summary.totalProfit) >= 0 ? "text-green-600" : "text-red-500"}`}>
              ฿{formatNumber(summary.totalProfit)}
            </p>
          </div>
        </div>
      )}

      {/* Period Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">กราฟยอดขาย</h2>
          <div className="flex gap-2">
            {[
              { key: "week", label: "7 วัน" },
              { key: "month", label: "30 วัน" },
              { key: "year", label: "12 เดือน" },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key as "week" | "month" | "year")}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  period === p.key
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">ออเดอร์ช่วงนี้</p>
            <p className="text-lg font-bold">{periodTotalOrders}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">รายรับช่วงนี้</p>
            <p className="text-lg font-bold text-green-600">฿{formatNumber(periodTotalRevenue)}</p>
          </div>
          <div className={`rounded-lg p-3 text-center ${periodTotalProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
            <p className="text-xs text-gray-500">กำไรช่วงนี้</p>
            <p className={`text-lg font-bold ${periodTotalProfit >= 0 ? "text-green-600" : "text-red-500"}`}>
              ฿{formatNumber(periodTotalProfit)}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            กำลังโหลด...
          </div>
        ) : (
          <>
            {/* Revenue Chart */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">💰 รายรับ</p>
              <div className="flex items-end gap-1 h-32">
                {chartData.map((d, i) => {
                  const height = (parseFloat(d.revenue) / maxRevenue) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-green-400 rounded-t transition-all hover:bg-green-500"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${d.date}: ฿${formatNumber(d.revenue)}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1 mt-1">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 text-center">
                    <p className="text-[10px] text-gray-400 truncate">
                      {formatShortDate(d.date)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Profit Chart */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">📈 กำไร</p>
              <div className="flex items-end gap-1 h-32">
                {chartData.map((d, i) => {
                  const profit = parseFloat(d.profit);
                  const height = (Math.abs(profit) / maxProfit) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t transition-all ${
                          profit >= 0
                            ? "bg-blue-400 hover:bg-blue-500"
                            : "bg-red-400 hover:bg-red-500"
                        }`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${d.date}: ฿${formatNumber(d.profit)}`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1 mt-1">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 text-center">
                    <p className="text-[10px] text-gray-400 truncate">
                      {formatShortDate(d.date)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Count Chart */}
            <div>
              <p className="text-sm text-gray-500 mb-2">📦 จำนวนออเดอร์</p>
              <div className="flex items-end gap-1 h-24">
                {chartData.map((d, i) => {
                  const maxOrders = Math.max(...chartData.map((x) => x.orderCount), 1);
                  const height = (d.orderCount / maxOrders) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-purple-400 rounded-t transition-all hover:bg-purple-500"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${d.date}: ${d.orderCount} ออเดอร์`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1 mt-1">
                {chartData.map((d, i) => (
                  <div key={i} className="flex-1 text-center">
                    <p className="text-[10px] text-gray-400 truncate">
                      {formatShortDate(d.date)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Status Distribution */}
      {summary && summary.statusCounts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold mb-4">สถานะออเดอร์</h2>
          <div className="space-y-2">
            {summary.statusCounts.map((sc) => {
              const percentage = (sc.count / summary.totalOrders) * 100;
              let color = "bg-gray-200";
              if (sc.status === "ยังไม่จ่าย") color = "bg-red-400";
              else if (sc.status === "จ่ายเงินแล้ว") color = "bg-yellow-400";
              else if (sc.status === "สั่งแล้ว") color = "bg-green-400";

              return (
                <div key={sc.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{sc.status}</span>
                    <span className="text-gray-500">
                      {sc.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
