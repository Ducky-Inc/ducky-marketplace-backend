## Ducky Marketplace Backend

### Setup

#### Install Dependencies

- Run `npm install` to install necessary packages.

#### Environment Configuration

- Create a `.env` file in the root directory.
  - Use `.env.template` as a reference.
  - Populate the `.env` file with appropriate values for the environment variables.
  - Generate Ethereum keys from [Vanity Eth](https://vanity-eth.tk/).

### Deployment

_TODO: Deployment instructions to be added._

### Development

- Start the development server:
  - Run `npm run dev`.

### Testing

_TODO: Testing instructions and framework details to be added._

### Architecture

The Ducky Marketplace Backend is part of a larger ecosystem several components:

- **Ducky Marketplace Backend**
  - This backend manages and interacts with:
    - **Ducky Marketplace Contracts**
      - **Ducky LSP8 Contracts**
        - Capable of emitting dynamic update events.
        - Implements perk functionality with an extensible Perk Schema.
    - **Ducky Marketplace Frontend**
      - The user interface for interacting with the marketplace.
      - Allows buyers to:
        - View and purchase assets.
        - View and manage their assets.
          - View their redemptions and perk usage.
          - Redeem perks.
        - Create and manage their own assets as Creators.
        - Allows creators to:
          - Create and manage their own assets.
          - View and manage their assets.
            - View redemptions and perk usage.
            - Fulfill redemptions.
            - Update asset metadata.
            - Update asset perks.

    - **Perk Asset SDK (conceptual)**
      - A framework to support developers integrating Perk Assets into their projects, such as games and applications.
      - Offers a versatile Perk Schema with various perk types like TimeBasedPerk, LevelBasedPerk, MembershipPerk, RedeemablePerk, etc.
      - Integration with Lukso KeyManager for trustless perk redemption (conceptual)

### Database Tables, contracts and other information

- **Asset Table**
  - Contains data scraped from the blockchain, including all asset types.
  - **Asset Types:**
    - **Assets - Ducky LSP8 (Creator Contract)**
    - (Type 4 LSP8 Digital Asset Contract )
      - Emits dynamic update events using the RequireRefresh event that outputs a json formatted string of the reason for the refresh so the backend or frontend can dynamically choose how to update the asset.
      - Tracks perk functionality with a comprehensive Perk Schema Framework.
        - Currently supports RedeemablePerk but extensible to other perk types.
          - TODO: Add a diverse range of Perks (e.g., TimeBasedPerk, LevelBasedPerk, MembershipPerk, RedeemablePerk, etc).
    - **MintedAssets - Ducky Minted LSP8 (Type 4 LSP8 Digital Asset Contract)**
      - Emits RequireRefresh events that output a json formatted string of the reason for the refresh so the backend or frontend can dynamically choose how to update the asset (conceptual).
      - Features perk functionality with a comprehensive Perk Schema Framework by interfacing with the Ducky LSP8 Creator Contract (prototyped).
        - Integrates with the Perk Asset SDK for Perk Schema Integration (conceptual).
      - Features auto-updating JSON metadata, managed by the marketplace backend as the asset is utilized.
        - A DTO of multiple events to execute via a keymanager can be sent via any user of the marketplace once signed, this will be in the terms of service and balanced according to the marketplace's business model (conceptual) to not be too expensive for the each user.

    - **Generic LSP8**
      - Currently not supported by the marketplace.
      - Future implementation may include listening for dataChange events to update metadata accordingly.

Perk Types and Use Cases:

- RedeemablePerk@1.0.0 - Redeemable for a physical or digital item.

- TimeBasedPerk@1.0.0 - Grants access to a digital item for a period of time. (conceptual)

- LevelBasedPerk@1.0.0 - Grants access to a digital item based on a user's level.  (conceptual)

- MembershipPerk@1.0.0 - Grants access to a digital item based on a user's membership status.  (conceptual)

- HoldingDurationPerk@1.0.0 - Grants access or benefits to a user who holds the digital item for a specified duration. This perk type is ideal for encouraging long-term engagement and loyalty. For example, a user might need to hold a digital collectible for six months to unlock exclusive content or receive a special reward.  (conceptual)

### LSP2 Perk Schema for Ducky Marketplace LSP8
<https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-2-ERC725YJSONSchema.md#value-type>
