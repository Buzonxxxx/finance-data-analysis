'use client'

export type TabName = 'yields' | 'stocks'

interface TabNavProps {
  activeTab: TabName
  onTabChange: (tab: TabName) => void
  updatedAt: string
}

export function TabNav({ activeTab, onTabChange, updatedAt }: TabNavProps) {
  const tabs: { key: TabName; label: string }[] = [
    { key: 'yields', label: '公債殖利率' },
    { key: 'stocks', label: '股價追蹤' },
  ]

  const updatedDate = new Date(updatedAt).toLocaleString('zh-TW', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })

  return (
    <nav className="bg-white border-b border-slate-200 px-5 flex items-center justify-between h-13">
      <div className="flex items-center gap-2">
        <span className="text-base font-bold text-slate-800">📊 總經財務分析</span>
      </div>
      <div className="flex">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={[
              'px-5 py-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === key
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-700',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-400">更新：{updatedDate}</span>
    </nav>
  )
}
