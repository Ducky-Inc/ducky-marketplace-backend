// This needs to act as a strategy and listen for an event from the main utility that will decide what schema version to use
// src/utils/schemas/Redeemable@0.0.1.ts

import { PERCUtilInterface } from '../../PERCUtil'

import PerkKeySchema from '../../../../../../contracts/DuckyAsset/_Schemas/LSP2PerkSchema/LSP2PerkSchema.json'

import {
  InputPERCMetadataType,
  OutputOffChainType,
  OutputOnChainType,
  OnChainPERCPropertyRedeemableType,
  OffChainPERCPropertiesRedeemableType,
  OutputOnChainTypeEncoded,
} from './InputMetadataType'
import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js'
import { CONSTANTS } from '../../../../../../constants/constants'
import { EncodeDataInput } from '@erc725/erc725.js/build/main/src/types/decodeData'
import {
  EncodeDataReturn,
  EncodeDataType,
} from '@erc725/erc725.js/build/main/src/types'
import EOAManagerService from '../../../../../EOAManagerService/EOAManagerService'
import { callParams } from '../../../../../../types/callParams'

const PERK_SCHEMA_VERSION = 'Redeemable@0.0.1'

export type Metadata = InputPERCMetadataType

export {
  InputPERCMetadataType,
  OffChainPERCPropertiesRedeemableType,
  OnChainPERCPropertyRedeemableType,
  OutputOnChainType,
}

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
  async encodeMetadataContract(
    metadataURI: string,
    metadata: Metadata,
    schema: string,
  ): Promise<OutputOnChainTypeEncoded> {
    // we pass the metadata to the contract as a stringified JSON object
    const { dataToSendToContract } =
      await this.encodeContractWithERC725(metadata)
    const { perkKeys: encodedPerkKeys, perkProperties: onChainPerkProperties } =
      dataToSendToContract

    console.log('encodedPerkKeys:', encodedPerkKeys)
    // Implementation specific to Redeemable@0-0-1
    const encodedMetadata: any = {
      metadata: metadataURI,
      perkKeys: encodedPerkKeys,
      perkProperties: onChainPerkProperties,
    }

    return encodedMetadata
  }

  encodeContractWithERC725 = async (
    metadata: Metadata,
    passedPerkSchema = PERK_SCHEMA_VERSION,
  ): Promise<{
    dataToSendToContract: {
      perkKeys: string[]
      perkProperties: string[]
    }
    passedPerkSchema?: string
  }> => {
    try {
      const perkID = CONSTANTS.TEST_PROPERTY_ID
      // Deserialize the perkKeys and perkProperties
      const { perkKeys, perkProperties, associatedAsset, perkName } = metadata

      // Create a new perk schema instance to encode the perk data
      const erc725 = new ERC725(
        PerkKeySchema as ERC725JSONSchema[],
        metadata.associatedAsset,
        CONSTANTS.RPC_URL,
      )

      let encodedDataArray: any = [] // Ensure this is initialized as an array

      // For each perk key, encode the key and then encode the data
      for (let i = 0; i < perkKeys.length; i++) {
        console.log('perkKeys:', perkKeys)
        const [perkPropertyID, schemaVersion] = perkKeys[i]

        console.log('perkPropertyID:', perkPropertyID)
        console.log('schemaVersion:', schemaVersion)

        if (schemaVersion !== passedPerkSchema) {
          console.log(`Skipping perkKey[${i}]: Schema version mismatch.`)
          continue
        }
        if (!Array.isArray(PerkKeySchema)) {
          throw new Error('PerkKeySchema is not an array or is undefined')
        }

        const value: string[] = [JSON.stringify(perkProperties[i])]
        console.log('value:', value)
        console.log('Encoding property:', { perkPropertyID, value })
        let perkPropertyIDHash = perkPropertyID.slice(0, -40)
        // remove the trailing 0x and whitespace
        perkPropertyIDHash = perkPropertyIDHash.slice(2).trim()

        console.log('perkPropertyIDHash:', perkPropertyIDHash)

        // export type EncodeDataType = string | string[] | JSONURLDataToEncode | boolean;

        let key = EOAManagerService.web3.utils.keccak256(
          associatedAsset + perkName,
        )
        let perkIDHex = '0x' + perkID

        const data: EncodeDataInput[] = [
          {
            keyName: CONSTANTS.PERK_SCHEMA_KEYS.PerkPropertyID,
            dynamicKeyParts: [key, perkIDHex],
            value: value,
          },
        ]
        console.log('data.keyName' + data[0].keyName)
        console.log('data.dynamicKeyParts' + data[0].dynamicKeyParts)
        console.log('data.value' + data[0].value)

        // encode to get the key with erc725
        const encodedData = erc725.encodeData(data)
        console.log('encodedData:', encodedData)

        if (encodedData.keys[0]) {
          console.log('encodedData:', encodedData)
          encodedDataArray.push(encodedData)
        }
        console.log('encodedData:', encodedData)

        if (!encodedDataArray || encodedDataArray.length === 0) {
          throw new Error('No valid perk data encoded')
        }

        console.log('encodedDataArray:', encodedDataArray)
        console.log('perkProperties:', perkProperties)
      }
      return {
        dataToSendToContract: {
          perkKeys: perkKeys.map(perkKey => perkKey[0]),
          perkProperties: perkProperties.map(perkProperty =>
            JSON.stringify([perkProperty[1]]),
          ),
        },
        passedPerkSchema,
      }
    } catch (error) {
      console.error('Error in encodeContractWithERC725:', error)
      throw error // rethrow the error for handling at a higher level
    }
  }
}

export default Redeemable001
export { OutputOnChainTypeEncoded }
