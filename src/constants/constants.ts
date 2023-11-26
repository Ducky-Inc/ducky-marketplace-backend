export const CONSTANTS = {
  NETWORLK_NAME: 'Testnet',
  RPC_URL: 'https://rpc.testnet.lukso.network',
  WEBSOCKET_RPC_URL: 'wss://ws-rpc.testnet.lukso.network',
  CHAIN_ID: 4201,
  IPFS_NODE_URL: 'https://ipfs.lukso.network',
  DISABLE_LOCAL_IPFS: true,
  PINATA_API_URL: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
  DB_CONNECTOR: 'sqlite::memory:',
  DUCKY_ASSET_START_BLOCK: 1458152,
  TEST_PROPERTY_ID: '0000000000000000000000000000000000000001',

  HTTP_STATUS_CODES: {
    TOO_MANY_REQUESTS: 429,
  },

  PERK_SCHEMA_KEYS: {
    PerkPropertyID: 'Perks:<bytes32>:<bytes32>',
    PerkPropertyIDHash: 'Perks:<bytes32>:<bytes32>',
    PerkPropertyKeys: 'Perks:PerkPropertyKeys:<bytes32>',
  },
}
