import IpfsService from '../../services/IPFSService/IPFSService'
// src/utils/PERCUtil.ts
import * as Redeemable001 from './PERCSchemas/Redeemable@0.0.1/Redeemable@0.0.1'

/*
 *
 */
export type Metadata = // This can be any of PERC Metadata types
  Redeemable001.Metadata // Redeemable@0.0.1

export type OutputOnChainTypeEncoded = Redeemable001.OutputOnChainTypeEncoded

export interface PERCUtilInterface {
  encodeMetadataIPFS(metadata: Metadata, schema: string): Object
  encodeMetadataContract(
    metadataURI: string,
    metadata: Metadata,
    schema: string,
  ): Object
}
/**
 * This utility handles operations related to PERC (Perk Encoding and Representation Convention).
 * This is a prototype and will be replaced by a more robust implementation in the future.
 */

export class PERCUtil {
  /**
   * Encodes metadata for a PERC.
   *
   * @param metadata - The metadata object to encode.
   * @param schema - The schema version to use for encoding.
   * @returns Encoded metadata to upload to IPFS, as well as the data to send to the contract
   */
  static async encodeMetadata(
    metadata: any,
    schema: string,
  ): Promise<{
    encodedMetadata: string
    dataToSendToContract: Redeemable001.OutputOnChainTypeEncoded
  }> {
    // This is a simplified example. The actual implementation would depend on the specific schema and version.
    // For instance, you might have different encoding strategies for different versions.

    switch (
      schema // This should use a strategy provider in the future as this is not scalable
    ) {
      case 'Redeemable@0.0.1':
        const redeemableStrategy = new Redeemable001.Redeemable001()
        // can be combined in to one object
        const encodedIPFS = redeemableStrategy.encodeMetadataIPFS(
          metadata,
          schema,
        )
        const encodedIPFSString = JSON.stringify(encodedIPFS)

        let PerkMetadataURI: string
        try {
          PerkMetadataURI = await IpfsService.uploadMetadata(encodedIPFSString)
          // add ipfs:// to the encodedIPFS.Metadata
          PerkMetadataURI = 'ipfs://' + PerkMetadataURI
        } catch (error) {
          console.error('Error uploading metadata to IPFS:', error)
          throw new Error('Failed to upload metadata to IPFS')
        }

        const encodedContract = redeemableStrategy.encodeMetadataContract(
          PerkMetadataURI,
          metadata,
          schema,
        )

        //make sure you set the URI for  encodedContract.Metadata to the IPFS URI
        // encodedContract.Metadata = encodedIPFS.Metadata
        console.log('encodedContract', encodedContract)

        // take all the elements in the encodedContract and encode them in to a string

        return {
          encodedMetadata: JSON.stringify(encodedIPFS),
          dataToSendToContract: encodedContract,
        }
      // Add more cases as needed for other schemas and versions.
      default:
        throw new Error(`Unsupported schema version: ${schema}`)
    }
  }

  // Additional utility methods related to PERC can be added here.
}

export default PERCUtil
