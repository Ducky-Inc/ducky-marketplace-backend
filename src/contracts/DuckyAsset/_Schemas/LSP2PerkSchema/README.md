# LSP2PerkSchema for DuckyAsset

## Introduction

`LSP2PerkSchema` is a dynamic and flexible schema designed for the `DuckyAsset` smart contract, tailored to the needs of a decentralized marketplace. It follows the ERC725Y standard and adheres to the LSP2 - ERC725Y JSON Schema guidelines, facilitating a standardized and consistent approach to encoding and decoding perk data.

## Schema Overview

The schema uses dynamic keys to uniquely identify and manage perks for each asset. It comprises three main components:

1. **Perk Metadata URI**: Links to detailed perk information stored off-chain, typically on IPFS or Arweave.
2. **PerkKeys Array**: ere
2. **PerkPropertyID Array**: A unique identifier for each perk, used to track and manage perk status.

## Schema Structure

```typescript
const LSP2PerkSchema = [
  {
    "name": "Perks:<AssetAddress>:<PerkName>:Metadata",
    "key": "0x7209ece5e2ac0f6752e14a92ae8f33b9a8c7f17a0ac7c6feedc322e8b9d5fe19",
    "keyType": "MappingWithGrouping",
    "valueType": "string",
    "valueContent": "JSONURL"
  },
  {
    "name": "Perks:<AssetAddress>:<PerkName>:<perkPropertyID>",
    "key": "0x0e6eff78e7d073729ba426f644c14a47696cd3a2fba4cdb008e7ba007b87c1b8c",
    "keyType": "MappingWithGrouping",
    "valueType": "boolean",
    "valueContent": "Boolean"
  }
  {
    "name": "Perks:<AssetAddress>:<PerkName>:<perkPropertyID>",
    "key": "0xe6eff78e7d073729ba426f644c14a47696cd3a2fba4cdb008e7ba007b87c1b8c",
    "keyType": "MappingWithGrouping",
    "valueType": "boolean",
    "valueContent": "Boolean"
  }
]

```

## Implementation

- The `PerkSchema` is crucial in the `DuckyAsset` smart contract for adding, tracking, and updating perks.
- It handles dynamic data associated with unique assets and perks, ensuring scalability and adaptability.

## Best Practices

- Ensure uniqueness in asset addresses and perk names to avoid overlaps.
- Regularly update off-chain metadata to keep perks relevant and accurate.
- Validate all data against the schema before encoding to maintain data integrity.

## Contribution

Contributions to improve or extend the `PerkSchema` are welcome. Please adhere to existing standards and guidelines for any modifications or additions.
