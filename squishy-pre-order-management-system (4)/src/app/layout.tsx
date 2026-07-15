import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบจัดการพรีออเดอร์สกุชชี่",
  description: "ระบบจัดการออเดอร์พรีออเดอร์สกุชชี่จากจีน",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <a href="/" className="text-lg font-semibold text-gray-800">
                🧸 Squishy Pre-order
              </a>
              <div className="flex items-center gap-2">
                <a
                  href="/dashboard"
                  className="text-gray-500 hover:text-gray-700 p-2"
                  title="Dashboard"
                >
                  📊
                </a>
                <a
                  href="/calculator"
                  className="text-gray-500 hover:text-gray-700 p-2"
                  title="เครื่องคิดเลข"
                >
                  💱
                </a>
                <a
                  href="/settings"
                  className="text-gray-500 hover:text-gray-700 p-2"
                  title="ตั้งค่า / Backup"
                >
                  ⚙️
                </a>
                <a
                  href="/orders/new"
                  className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  + เพิ่มออเดอร์
                </a>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
