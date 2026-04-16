import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        operational: '#22c55e',
        degraded: '#f59e0b',
        partial_outage: '#f97316',
        major_outage: '#ef4444',
        unknown: '#94a3b8',
      },
    },
  },
  plugins: [],
}

export default config
