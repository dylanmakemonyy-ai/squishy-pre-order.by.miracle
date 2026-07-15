"use client";

import { useEffect, useState, useCallback } from "react";

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

interface Summary {
  totalOrders: number;
  totalRevenue: string;
  totalCost: string;
  totalShipping: string;
  totalProfit: string;
  statusCounts: { status: string; count: number }[];
}

interface ShipmentGroup {
  id: number;
  name: string;
  trackingNumber: string | null;
  status: string;
  notes: string | null;
  orderCount: number;
  createdAt: string;
}

const ORDER_STATUSES = ["ทั้งหมด", "ยังไม่จ่าย", "จ่ายเงินแล้ว", "สั่งแล้ว"];

const ORDER_STATUS_COLORS: Record<string, string> = {
  "ยังไม่จ่าย": "bg-red-100 text-red-700",
  "จ่ายเงินแล้ว": "bg-yellow-100 text-yellow-700",
  "สั่งแล้ว": "bg-green-100 text-green-700",
};

const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  "รอเข้าโกดัง": "bg-yellow-100 text-yellow-800",
  "เข้าโกดัง": "bg-blue-100 text-blue-800",
  "ออกโกดัง": "bg-purple-100 text-purple-800",
  "ถึงโกดังไทย": "bg-orange-100 text-orange-800",
  "ถึงแล้ว": "bg-green-100 text-green-800",
};

function formatNumber(val: string | number) {
  const num = typeof val === "string" ? parseFloat(val) : val;
  return num.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getDateRange(preset: string) {
  const today = new Date();
  const yyyy = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "today": {
      const d = yyyy(today);
      return { dateFrom: d, dateTo: d };
    }
    case "week": {
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      return { dateFrom: yyyy(monday), dateTo: yyyy(today) };
    }
    case "month": {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return { dateFrom: yyyy(firstDay), dateTo: yyyy(today) };
    }
    default:
      return { dateFrom: "", dateTo: "" };
  }
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"orders" | "shipments">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [shipments, setShipments] = useState<ShipmentGroup[]>([]);
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Modal สำหรับสร้างกลุ่มพัสดุใหม่
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupTracking, setNewGroupTracking] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ทั้งหมด") params.set("status", statusFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (searchQuery) params.set("search", searchQuery);

    const summaryParams = new URLSearchParams();
    if (dateFrom) summaryParams.set("dateFrom", dateFrom);
    if (dateTo) summaryParams.set("dateTo", dateTo);

    const [ordersRes, summaryRes] = await Promise.all([
      fetch(`/api/orders?${params}`),
      fetch(`/api/orders/summary?${summaryParams}`),
    ]);

    setOrders(await ordersRes.json());
    setSummary(await summaryRes.json());
    setLoading(false);
  }, [statusFilter, dateFrom, dateTo, searchQuery]);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/shipments");
    setShipments(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    } else {
      fetchShipments();
    }
  }, [activeTab, fetchOrders, fetchShipments]);

  function handlePreset(preset: string) {
    setDatePreset(preset);
    if (preset === "all") {
      setDateFrom("");
      setDateTo("");
    } else {
      const { dateFrom: df, dateTo: dt } = getDateRange(preset);
      setDateFrom(df);
      setDateTo(dt);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchQuery(searchInput);
  }

  function clearSearch() {
    setSearchInput("");
    setSearchQuery("");
  }

  async function createShipmentGroup() {
    setCreatingGroup(true);

    const res = await fetch("/api/shipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newGroupName || `กล่องพัสดุ ${new Date().toLocaleDateString("th-TH")}`,
        trackingNumber: newGroupTracking || null,
      }),
    });

    if (res.ok) {
      setNewGroupName("");
      setNewGroupTracking("");
      setShowCreateModal(false);
      fetchShipments();
    }
    setCreatingGroup(false);
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (statusFilter !== "ทั้งหมด") params.set("status", statusFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    window.location.href = `/api/orders/export?${params}`;
  }

  return (
    <div className="space-y-6">
      {/* Quick Links */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/dashboard"
          className="text-sm px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
        >
          📊 Dashboard
        </a>
        <a
          href="/calculator"
          className="text-sm px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
        >
          💱 เครื่องคิดเลข
        </a>
        <button
          onClick={handleExport}
          className="text-sm px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
        >
          📤 Export Excel
        </button>
        <a
          href="/settings"
          className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          💾 Backup ข้อมูล
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === "orders"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📦 ออเดอร์
        </button>
        <button
          onClick={() => setActiveTab("shipments")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === "shipments"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          🚚 กลุ่มพัสดุ
        </button>
      </div>

      {activeTab === "orders" ? (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-500">ออเดอร์ทั้งหมด</p>
                <p className="text-2xl font-bold mt-1">{summary.totalOrders}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-500">รายรับ (จากลูกค้า)</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  ฿{formatNumber(summary.totalRevenue)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-500">รายจ่าย (ต้นทุน+ค่าส่ง)</p>
                <p className="text-2xl font-bold mt-1 text-red-500">
                  ฿
                  {formatNumber(
                    parseFloat(summary.totalCost) +
                      parseFloat(summary.totalShipping)
                  )}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-xs text-gray-500">กำไรสุทธิ</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    parseFloat(summary.totalProfit) >= 0
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  ฿{formatNumber(summary.totalProfit)}
                </p>
              </div>
            </div>
          )}

          {/* Status Summary */}
          {summary && summary.statusCounts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {summary.statusCounts.map((sc) => (
                <span
                  key={sc.status}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                    ORDER_STATUS_COLORS[sc.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {sc.status}: {sc.count}
                </span>
              ))}
            </div>
          )}

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="🔍 ค้นหาชื่อลูกค้า, สินค้า..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition"
            >
              ค้นหา
            </button>
          </form>

          {searchQuery && (
            <p className="text-sm text-gray-500">
              ผลการค้นหา &quot;{searchQuery}&quot;: {orders.length} รายการ
            </p>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <p className="text-sm text-gray-500 self-center mr-2">ช่วงเวลา:</p>
              {[
                { key: "all", label: "ทั้งหมด" },
                { key: "today", label: "วันนี้" },
                { key: "week", label: "สัปดาห์นี้" },
                { key: "month", label: "เดือนนี้" },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => handlePreset(p.key)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    datePreset === p.key
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">จากวันที่</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setDatePreset("custom");
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">ถึงวันที่</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setDatePreset("custom");
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <p className="text-sm text-gray-500 self-center mr-2">สถานะ:</p>
              {ORDER_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                    statusFilter === s
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Order List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">📦</p>
                <p>{searchQuery ? "ไม่พบผลการค้นหา" : "ยังไม่มีออเดอร์"}</p>
              </div>
            ) : (
              orders.map((order) => {
                const profit =
                  parseFloat(order.sellingPrice) -
                  parseFloat(order.costPrice) -
                  parseFloat(order.shippingCost);

                return (
                  <a
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-400 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
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
                          {order.shipmentGroupId && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              📦 กลุ่ม #{order.shipmentGroupId}
                            </span>
                          )}
                        </div>
                        <p className="font-medium mt-1 truncate">
                          {order.customerName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {order.productName} x{order.quantity}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          📅 {order.orderDate}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">กำไร</p>
                        <p
                          className={`text-lg font-bold ${
                            profit >= 0 ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          ฿{formatNumber(profit)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          รับ ฿{formatNumber(order.sellingPrice)}
                        </p>
                      </div>
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Shipments Tab */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">กลุ่มพัสดุทั้งหมด</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              + สร้างกลุ่มพัสดุ
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">🚚</p>
              <p>ยังไม่มีกลุ่มพัสดุ</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                + สร้างกลุ่มพัสดุใหม่
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {shipments.map((group) => (
                <a
                  key={group.id}
                  href={`/shipments/${group.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-400 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs text-gray-400">
                          #{group.id}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            SHIPMENT_STATUS_COLORS[group.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {group.status}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {group.orderCount} ออเดอร์
                        </span>
                      </div>
                      <p className="font-medium text-gray-700">{group.name}</p>
                    </div>
                    
                    {/* เลข Tracking ใหญ่ๆ */}
                    <div className="text-right shrink-0">
                      {group.trackingNumber ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                          <p className="text-xs text-blue-600 mb-1">เลขพัสดุ</p>
                          <p className="text-lg font-bold font-mono text-blue-800">
                            {group.trackingNumber}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                          <p className="text-xs text-gray-400">เลขพัสดุ</p>
                          <p className="text-sm text-gray-400">ยังไม่ระบุ</p>
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Shipment Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">🚚 สร้างกลุ่มพัสดุใหม่</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  ชื่อกลุ่มพัสดุ
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={`กล่องพัสดุ ${new Date().toLocaleDateString("th-TH")}`}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  เลข Tracking (ใส่ทีหลังได้)
                </label>
                <input
                  type="text"
                  value={newGroupTracking}
                  onChange={(e) => setNewGroupTracking(e.target.value)}
                  placeholder="เลขพัสดุจากจีน"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewGroupName("");
                  setNewGroupTracking("");
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={createShipmentGroup}
                disabled={creatingGroup}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {creatingGroup ? "กำลังสร้าง..." : "สร้างกลุ่มพัสดุ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
