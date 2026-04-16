import type { Provider } from '@/lib/types'
import { ModelRow } from './ModelRow'

type Props = { provider: Provider }

export function ProviderSection({ provider }: Props) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        {provider.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={provider.logoUrl} alt={provider.name} className="w-6 h-6 rounded" />
        )}
        <div>
          <h2 className="font-semibold text-slate-900">{provider.name}</h2>
          {provider.website && (
            <a
              href={provider.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {provider.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>

      {/* Models */}
      <div className="px-6 divide-y divide-slate-100">
        {provider.models.length === 0 ? (
          <p className="py-4 text-sm text-slate-400">No models configured</p>
        ) : (
          provider.models.map((model) => (
            <ModelRow key={model.id} model={model} />
          ))
        )}
      </div>
    </section>
  )
}
