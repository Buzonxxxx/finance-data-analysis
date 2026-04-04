'use client'

import { useState } from 'react'
import { TabNav, type TabName } from '@/components/TabNav'
import { YieldTab } from '@/components/yields/YieldTab'
import { StockTab } from '@/components/stocks/StockTab'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabName>('yields')
  const updatedAt = new Date().toISOString()

  return (
    <main className="min-h-screen bg-slate-50">
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} updatedAt={updatedAt} />
      {activeTab === 'yields' ? <YieldTab /> : <StockTab />}
    </main>
  )
}
