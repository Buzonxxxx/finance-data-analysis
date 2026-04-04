import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '總經財務分析',
  description: '公債殖利率倒掛監測與股價長期追蹤',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  )
}
