package templates

var ExecutionClientTemplate = `
FROM g1g2/g1g2-execution-client:{{.Version}}

COPY init_l2_geth.sh /init_l2_geth.sh
COPY l2_genesis.json /l2_genesis.json
ENTRYPOINT ["/init_l2_geth.sh"]
`
