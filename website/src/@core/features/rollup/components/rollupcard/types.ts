// ** React Imports
import Rollup from '@/interfaces/rollup'
import { ReactNode } from 'react'

// ** Types
import { ThemeColor } from 'src/@core/layouts/types'

export type RollupCardProps = {
  title: string
  status: string
  icon: ReactNode
  subtitle: string
  color?: ThemeColor
  trendNumber: string
  trend?: 'positive' | 'negative'
  rollup: Rollup
}
