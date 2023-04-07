// TODO: use typechain
export const sigHashes = {
  '0x095ea7b3': 'approve',
  // L1_Bridge
  '0xdeace8f5': 'sendToL2', // L1 -> L2
  // L2_Bridge
  '0xeea0d7b2': 'swapAndSend', // L2 -> L2 / L2 -> L1
  // L1_Bridge / L2_Bridge
  '0x0f7aadb7': 'withdraw', // L2 -> L2 / L2 -> L1 (bonder offline)
  '0x3d12a85a': 'bondWithdrawalAndDistribute',
  '0xcc29a306': 'distribute',
}
