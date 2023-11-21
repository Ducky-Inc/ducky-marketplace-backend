# PerkSchema for DuckyAsset

## Introduction

`PerkSchema` is a dynamic and flexible schema designed for the `DuckyAsset` smart contract, tailored to the needs of a decentralized marketplace. It follows the ERC725Y standard and adheres to the LSP2 - ERC725Y JSON Schema guidelines, facilitating a standardized and consistent approach to encoding and decoding perk data.

## Schema Overview

The schema uses dynamic keys to uniquely identify and manage perks for each asset. It comprises three main components:

1. **PerkMetadata**: Links to detailed perk information stored off-chain, typically on IPFS.
2. **PerkRedeemedStatus**: Indicates the redemption status of a perk.
3. **PerkFulfilledStatus**: Shows the fulfillment status of a perk.

## Schema Structure

```typescript
const PerkSchema = [
    {
        name: 'PerkMetadata',
        key: 'Perks:<AssetAddress>:<PerkName>:Metadata',
        keyType: 'MappingWithGrouping',
        valueType: 'string',
        valueContent: 'JSONURL'
    },
    {
        name: 'PerkRedeemedStatus',
        key: 'Perks:<AssetAddress>:<PerkName>:Redeemed',
        keyType: 'MappingWithGrouping',
        valueType: 'boolean',
        valueContent: 'Boolean'
    },
    {
        name: 'PerkFulfilledStatus',
        key: 'Perks:<AssetAddress>:<PerkName>:Fulfilled',
        keyType: 'MappingWithGrouping',
        valueType: 'boolean',
        valueContent: 'Boolean'
    }
];
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
