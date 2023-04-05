FROM node:18.12.1 as builder

WORKDIR /src
COPY ./package.json ./yarn.lock ./
RUN yarn install --network-timeout 1000000

# use an empty hardhat to download certain version compiler 
COPY ./docker/hardhat.config.ts .
COPY ./contracts/base ./empty-contracts
RUN yarn build

FROM node:18.12.1

# SHELL ["/bin/bash", "-o", "pipefail", "-c"]
# RUN curl -L https://foundry.paradigm.xyz | bash \
#   && /root/.foundry/bin/foundryup \
#   && mv /root/.foundry/bin/* /usr/bin/

WORKDIR /src

COPY . ./g1g2-contracts/packages/protocol/
COPY --from=builder /src/node_modules ./g1g2-contracts/packages/protocol/node_modules/
COPY --from=builder /root/.cache/hardhat-nodejs /root/.cache/hardhat-nodejs/
