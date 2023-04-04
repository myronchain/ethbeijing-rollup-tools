FROM ethereum/client-go:v1.10.25

COPY init_l1_geth.sh /init_l1_geth.sh
COPY l1_genesis.json /l1_genesis.json
ENTRYPOINT ["/init_l1_geth.sh"]