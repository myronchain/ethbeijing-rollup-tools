import Rollup from 'mdi-material-ui/Rollupjs'
import PlusBox from 'mdi-material-ui/PlusBox'

// ** Type import
import { VerticalNavItemsType } from 'src/@core/layouts/types'

const navigation = (): VerticalNavItemsType => {
  return [
    {
      title: 'Dashboard',
      icon: Rollup,
      path: '/rollup'
    },
    {
      title: 'BYOR',
      icon: PlusBox,
      path: '/create-rollup'
    },
  ]
}

export default navigation
