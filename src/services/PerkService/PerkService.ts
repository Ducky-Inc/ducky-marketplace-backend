import Web3, { Contract, TransactionReceipt } from 'web3'
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js'
// import { DecodeDataOutput } from "@erc725/erc725.js/build/main/src/types/decodeData";
// import { EncodeDataReturn } from "@erc725/erc725.js/build/main/src/types/encodeData/JSONURL";
// import { GetDataDynamicKey } from "@erc725/erc725.js/build/main/src/types/GetData";
import { Request, Response } from 'express'

import { CONSTANTS } from '../../constants/constants'
// import { CONTRACTS } from "../../constants/contracts";
import EOAManagerService from '../EOAManagerService/EOAManagerService'
import IpfsService from '../IPFSService/IPFSService'

type IpfsServiceType = typeof IpfsService
import { IaddPerkRequest } from '../../interfaces/IaddPerkRequest'

import LSP6Schema from '@erc725/erc725.js/schemas/LSP6KeyManager.json'
import PerkSchema from '../../contracts/DuckyAsset/_Schemas/LSP2PerkSchema/LSP2PerkSchema.json'
import { EncodeDataInput } from '@erc725/erc725.js/build/main/src/types/decodeData'
import { EncodeDataReturn } from '@erc725/erc725.js/build/main/src/types'
import { callParams } from '../../types/callParams'
/*
 * This service is responsible for:
 *  - adding new perks to LSP8 contracts
 *     - Encoding perk with LSP2 standard
 *     - (TODO): Upload attributes file to IPFS to update perks LSP4NFTMetadata attributes
 *     - Add perk metadata to LSP8 contract
 */
class PerkService {
  constructor() {} // no need to initialize anything as they are singletons to prevent multiple instances

  /* Handle a new perk addition request
   * - Upload the perk metadata to IPFS
   * - Encode the perk data with the LSP2 standard
   * - Send the perk data to the key manager
   */
  async addPerk({
    assetAddress,
    perkName,
    data,
    factoryAddress,
    req,
    res,
    relayThroughUser = false,
  }: IaddPerkRequest) {
    try {
      const provider = CONSTANTS.RPC_URL

      // Create a new perk schema instance to encode the perk data
      const erc725 = new ERC725(
        PerkSchema as ERC725JSONSchema[],
        assetAddress,
        provider,
      )
      // get the owner, if it fails then the asset does not exist
      await erc725.getOwner().catch(error => {
        throw new Error('Error getting owner of asset: ' + error.message)
      })

      const { metadata, perkKeys, perkProperties } = data

      if (relayThroughUser) {
        throw new Error('Relay through user not implemented yet')
      } else {
        if (perkKeys.length !== perkProperties.length) {
          throw new Error(
            'Error encoding data, perkKeys and perkProperties are not the same length',
          )
        }
        console.log('perkKeys:', perkKeys)
        console.log('perkProperties:', perkProperties)

        const txHash = await EOAManagerService._call({
          contractAddress: factoryAddress,
          methodName: 'addPerk',
          params: {
            types: ['address', 'string', 'string', 'bytes32[]', 'string[]'],
            values: [
              assetAddress,
              perkName,
              metadata,
              perkKeys,
              perkProperties,
            ],
          },
        })
        console.log('txHash:', txHash)
        const receipt: TransactionReceipt | void =
          await EOAManagerService.waitForTransactionReceipt(txHash)
        if (!receipt || !receipt.status) {
          throw new Error('Error getting transaction receipt')
        }

        // This function is used to serialize the BigInts in the receipt so that they can be sent to the frontend,
        // since JSON.stringify does not support BigInts
        const deepSerializeBigInt = (obj: Object): Object => {
          if (obj === null || obj === undefined) {
            return obj
          } else if (typeof obj === 'bigint') {
            return obj.toString()
          } else if (Array.isArray(obj)) {
            return obj.map(deepSerializeBigInt)
          } else if (typeof obj === 'object') {
            const serializedObj: Record<string, any> = {}
            for (const [key, value] of Object.entries(obj)) {
              serializedObj[key] = deepSerializeBigInt(value)
            }
            return serializedObj
          } else {
            return obj
          }
        }

        const serializedReceipt = deepSerializeBigInt(receipt)

        res.status(200).json({
          message: 'Perk addition request processed',
          txHash,
          receipt: serializedReceipt,
        })
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred'
      const serializedError =
        error instanceof Error
          ? { message: error.message, name: error.name }
          : { error }
      console.log('serializedError:', serializedError)
      res
        .status(500)
        .json({ error: errorMessage, errorObject: serializedError })
    }
  }
}

export default new PerkService()
