package templates

type L1TemplateData struct {
	L1ChainId              uint32
	L1MinerPriv            string
	L1MinerAddress         string
	L1MinerAddressWithou0x string
	L1FaucetAddress        string
	L1HttpPort             uint
	L1WsPort               uint
	L1AuthRpcPort          uint
}
