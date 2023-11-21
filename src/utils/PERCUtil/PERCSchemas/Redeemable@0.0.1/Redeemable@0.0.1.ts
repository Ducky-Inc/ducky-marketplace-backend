// This needs to act as a strategy and listen for an event from the main utility that will decide what schema version to use
// src/utils/schemas/Redeemable@0.0.1.ts

import { PERCUtilInterface } from '../../PERCUtil'
import {
  InputPERCMetadataType,
  OutputOffChainType,
  OutputOnChainType,
  OnChainPERCPropertyRedeemableType,
  OffChainPERCPropertiesRedeemableType,
  OutputOnChainTypeEncoded,
} from './InputMetadataType'

export type Metadata = InputPERCMetadataType

export class Redeemable001 implements PERCUtilInterface {
  // Extract and encode the off-chain metadata for a Redeemable@0-0-1 PERC
  encodeMetadataIPFS(metadata: Metadata, schema: string): OutputOffChainType {
    const {
      perkName,
      description,
      associatedAsset,
      creator,
      mainContact,
      additionalDetails,
      perkKeys,
      perkProperties,
    } = metadata

    // Implementation specific to Redeemable@0.0.1
    const encodedMetadata: OutputOffChainType = {
      perkName,
      description,
      associatedAsset,
      creator,
      mainContact,
      additionalDetails,
      perkKeys,
      perkProperties,
    }
    return encodedMetadata
  }

  // Extract and encode the on-chain metadata for a Redeemable@0-0-1 PERC
  encodeMetadataContract(
    metadataURI: string,
    metadata: Metadata,
    schema: string,
  ): OutputOnChainTypeEncoded {
    const { perkKeys, perkProperties } = metadata

    // Implementation specific to Redeemable@0-0-1
    // convert the perkProperties to the on-chain type
    // Takes in the perkProperties data and converts it to the on-chain type
    const onChainPerkProperties: [string][] = perkProperties.map(
      ([perkPropertyID, offChainPERCPropertiesRedeemableType]): [string] => {
        const onChainPERCPropertyRedeemableType: OnChainPERCPropertyRedeemableType =
          {
            redeemed: offChainPERCPropertiesRedeemableType.redeemed,
          }
        return [
          [
            perkPropertyID,
            JSON.stringify(onChainPERCPropertyRedeemableType),
          ].toString(),
        ]
      },
    )

    // Return a list of the perkKeys encoded as strings
    const encodedPerkKeys: string[] = perkKeys.map(
      ([perkPropertyID, schema]) => {
        return [perkPropertyID, schema].toString()
      },
    )

    // Implementation specific to Redeemable@0-0-1
    const encodedMetadata: OutputOnChainTypeEncoded = {
      metadata: metadataURI,
      perkKeys: encodedPerkKeys,
      perkProperties: onChainPerkProperties,
    }

    return encodedMetadata
  }
}

export default Redeemable001
export { OutputOnChainTypeEncoded }
