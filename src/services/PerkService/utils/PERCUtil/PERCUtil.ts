import IpfsService from '../../../IPFSService/IPFSService'
import EOAManagerService from '../../../EOAManagerService/EOAManagerService'
// src/utils/PERCUtil.ts
import * as Redeemable001 from './PERCSchemas/Redeemable@0.0.1/Redeemable@0.0.1'
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js'

import { IRedeemRequest } from '../../../../interfaces/IRedeemRequest'
import { IaddPerkRequest } from '../../../../interfaces/IaddPerkRequest'

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

export interface ICreatePerkMetadata {
  perkName: string
  description: string
  mintedAssetAddress: string
  mainContractAddress: string
  perkSchema: string
  creator: {
    creatorName: string
    creatorContactInfo: string
    creatorAddress: string
  }
  // an array containing key/value pairs
  additionalDetails: {
    [key: string]: any
  }
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
   * @returns: 
   *         - Off chain:
   *              - Metadata - Encoded metadata to upload to IPFS, as well as the data to send to the contract
   *         - On chain:
   *              - Metadata - Data to store off-chain for the PERC
   *              - perkKeys - perkPropertyID's and schemaTypes@versions that this perk uses
   *              - perkProperties - perkPropertyIDs and the associated dynamic perkProperties depending on the schema type

   */
  static async encodeMetadata(metadata: Metadata): Promise<{
    metadataURI: string
    dataToSendToContract: Redeemable001.OutputOnChainTypeEncoded
  }> {
    // Get the schema version from the metadata object and use it to determine the encoding strategy.
    // For the first nonce and schema@version we will use the Redeemable@0-0-1 schema for testing
    const schema = metadata.perkKeys[0][1] // get the second element in the first array in the perkKeys array, our first iteration of this will only have one element in the array
    // if it's a Redeemable this should return Redeemable@0-0-1

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
        const encodedIPFSJSON = JSON.stringify(encodedIPFS)

        let PerkMetadataURI: string
        try {
          PerkMetadataURI = await IpfsService.uploadMetadata(encodedIPFSJSON)
          // add ipfs:// to the encodedIPFS.Metadata
          PerkMetadataURI = 'ipfs://' + PerkMetadataURI
        } catch (error) {
          console.error('Error uploading metadata to IPFS:', error)
          throw new Error('Failed to upload metadata to IPFS')
        }

        const encodedContract = await redeemableStrategy.encodeMetadataContract(
          PerkMetadataURI,
          metadata,
          schema,
        )

        //make sure you set the URI for  encodedContract.Metadata to the IPFS URI
        // encodedContract.Metadata = encodedIPFS.Metadata
        console.log('encodedContract', encodedContract)

        // take all the elements in the encodedContract and encode them in to a string

        return {
          metadataURI: PerkMetadataURI,
          dataToSendToContract: encodedContract,
        }
      // Add more cases as needed for other schemas and versions.
      default:
        throw new Error(`Unsupported schema version: ${schema}`)
    }
  }

  // Helper function to clean up the PERC Metadata type creation
  static createPERCMetadata = async ({
    perkName,
    description,
    mintedAssetAddress,
    mainContractAddress,
    perkSchema,
    creator: {
      creatorName = 'Ducky Marketplace',
      creatorContactInfo = 'https://ducky.group/contact',
      creatorAddress = '0xBb68EEeEDA2DEdb421A4D801113241a5d76906Fc',
    },
    additionalDetails = {
      ['Hello World']: 'Welcome to the Ducky Marketplace!',
    },
    ...rest // we will pass in perkKeys and perkProperties here depending on the schema type
  }: ICreatePerkMetadata): Promise<Metadata> => {
    const perkPropertyID = await PERCUtil.generatePerkPropertyID({
      assetAddress: mintedAssetAddress,
      perkName,
    })

    // An example of the PERC Metadata that we will encode for the perk
    const metadata: Metadata = {
      perkName: perkName,
      description: description,
      associatedAsset: mintedAssetAddress,
      mainContact: mainContractAddress,
      creator: {
        name: creatorName,
        contactInfo: creatorContactInfo,
        address: creatorAddress,
      },
      additionalDetails: additionalDetails,
      // perk propertyID's and schemaTypes@versions that this perk uses
      // We could just use LSP2 here and store everything that way but we would need to encode and decode everything and handle all that, for now we will just do this
      perkKeys: [],
      perkProperties: [],
    }

    // We can have a function here to abstract this out and make it more generic,
    // so we can pass in schema and the dynamic properties and it will return the updated metadata object
    //something like
    // const metadataWithPerks = PERCUtil.addPerkPropertiesToMetadata(
    //   metadata,
    //   perkPropertyID,
    // {key: value} // validated according to the perk schema by the straegy defined for the schema and versioin
    // )
    metadata.perkKeys.push([perkPropertyID, perkSchema])

    const perk: [string, Redeemable001.OffChainPERCPropertiesRedeemableType] = [
      perkPropertyID,
      {
        redeemed: false,
      },
    ]
    metadata.perkProperties.push(perk)

    return metadata
  }

  // checkRedemptionRequest = (req: Request): boolean => {
  //   const { redeemRequest } = req.body as { redeemRequest: IRedeemRequest }
  //   const { assetAddress, perkName, metadata } = redeemRequest
  //   return (
  //     typeof assetAddress === 'string' &&
  //     typeof perkName === 'string' &&
  //     typeof metadata === 'string'
  //   )
  // }

  static generatePerkPropertyID = async ({
    assetAddress,
    perkName,
  }: {
    assetAddress: string
    perkName: string
  }) => {
    // generate a perk propertyID (nonce to prevent collisions) for the perk
    // We use a nonce so we can generate a unique propertyID for multiple schema types
    const nonce = EOAManagerService.web3.utils.randomHex(32)
    const perkPropertyIDString = EOAManagerService.web3.utils.keccak256(nonce)
    const perkPropertyID = ERC725.encodeKeyName(
      'Perks:<AssetAddress>:<PerkName>:<perkPropertyID>',
      [assetAddress, perkName, perkPropertyIDString],
    )
    return perkPropertyID
  }
}

export default PERCUtil
