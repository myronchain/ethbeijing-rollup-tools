import React from 'react'
import { useLocation } from 'react-router-dom'
import Box from '@material-ui/core/Box'
import Typography from '@material-ui/core/Typography'
import MenuItem from '@material-ui/core/MenuItem'
import RaisedSelect from '@/bridge/components/selects/RaisedSelect'
import SelectOption from '@/bridge/components/selects/SelectOption'

function SendHeader(props) {
  const { styles, bridges, selectedBridge, handleBridgeChange, deposit } = props
  const location = useLocation()

  return (
    <div className={styles.header}>
      <Box display="flex" alignItems="center" className={styles.sendSelect}>
        <Typography variant="h4" className={styles.sendLabel}>
          { deposit ? "Deposit" : "Withdraw"}
        </Typography>
        <RaisedSelect value={selectedBridge?.getTokenSymbol() || "ETH"} onChange={handleBridgeChange}>
          {bridges.map(bridge => (
            <MenuItem value={bridge.getTokenSymbol()} key={bridge.getTokenSymbol()}>
              <SelectOption
                value={bridge.getTokenSymbol()}
                icon={bridge.getTokenImage()}
                label={bridge.getTokenSymbol()}
              />
            </MenuItem>
          ))}
        </RaisedSelect>
      </Box>
    </div>
  )
}

export default SendHeader
