import { AdminAnalisisNav } from '@/components/dentcore/analisis/admin-analisis-nav'

export default function AdminAnalisisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[calc(100vh-112px)]">
      <AdminAnalisisNav />
      <main className="flex-1 overflow-auto p-4">
        {children}
      </main>
    </div>
  )
}
