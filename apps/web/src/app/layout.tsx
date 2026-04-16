import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Status',
  description: 'Real-time status of AI models and providers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
              <a href="/" className="flex items-center gap-2 font-bold text-slate-900">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                AI Status
              </a>
              <nav className="flex items-center gap-6 text-sm text-slate-600">
                <a href="/" className="hover:text-slate-900 transition-colors">
                  Status
                </a>
                <a href="/incidents" className="hover:text-slate-900 transition-colors">
                  Incidents
                </a>
              </nav>
            </div>
          </header>

          <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
            {children}
          </main>

          <footer className="border-t border-slate-200 mt-auto">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-xs text-slate-400">
              <span>Powered by AI Status</span>
              <a
                href="https://github.com/your-org/ai-status"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-600 transition-colors"
              >
                Open source on GitHub
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
