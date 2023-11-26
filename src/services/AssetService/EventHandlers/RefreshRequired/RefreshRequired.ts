import AssetTableService from '../../utils/AssetTableUtil'
import AssetServiceUtil from '../../utils/AssetServiceUtil'

import { IAsset } from '../../../../models/AssetModel/Asset.model'
import Perk, { IPerk } from '../../../../models/PerkModel/Perk.model'
import { IProcessedLogs } from '../../utils/AssetServiceUtil'
import AssetService, { IEventStrategy } from '../../AssetService'
import IPFSService from '../../../../services/IPFSService/IPFSService'
import EOAManagerService from '../../../../services/EOAManagerService/EOAManagerService'

import { callParams } from '../../../../types/callParams'
import { EVENT_SIGNATURE } from '../../constants'
import { LSP2KEY_CONSTANTS } from '../LSP2SchemaKeyConstants'
import LSP2PerkSchema from '../../../../contracts/DuckyAsset/_Schemas/LSP2PerkSchema/LSP2PerkSchema.json'
import LSP2Service from '../../../LSP2Service/LSP2Service'
import { ERC725JSONSchema } from '@erc725/erc725.js'
import { EncodeDataReturn } from '@erc725/erc725.js/build/main/src/types'
import { CONSTANTS } from '../../../../constants/constants'
import PERCUtil from '../../../PerkService/utils/PERCUtil/PERCUtil'

// This event is emitted when a new perk is added to an asset
interface IRefreshRequiredEvent {
  action: string // 'PerkAdded'
  assetAddress: string // '0x53ddb2eb889bdaba1f8438fe8c1c6eb4a4e2a127'
  perkName: string // 'Ducky Perk'
  key: string // '0x6a3c79356cb1413ef6bff15a0785660f0b67baafe0d0e269b68750e0930c2398'
}

class RefreshRequiredStrategy implements IEventStrategy {
  constructor() {}

  //validate it matches our schema
  private _validateJSON = async (
    jsonData: any,
    eventSignature: string,
  ): Promise<boolean> => {
    const valid = AssetServiceUtil.validateJSONData(jsonData, eventSignature)
    if (!valid) {
      return false
    }
    console.log('Found valid refreshRequired event JSON data')
    return true
  }

  private _fetchMetadata = async (assetMetadataURI: string): Promise<any> => {
    //get the metadata from the URI
    if (assetMetadataURI) {
      let metadata = {}

      try {
        const response: any =
          await IPFSService.retrieveFromIPFS(assetMetadataURI)
        if (!response) {
          throw new Error('Error getting metadata from IPFS')
        }
        if (response.description) {
          metadata = response
        }
      } catch (error) {
        throw new Error('Error getting metadata from IPFS')
      }
      return metadata
    }
  }

  private _fetchAllPerkKeyData = async ({
    factoryLSP8Address,
    propertyID,
    rawJsonData,
    mintedAssetAddress,
    fetchPerkMetadata = false,
    fetchPerkKeys = false,
    fetchperkPropertyIDData = true,
  }: {
    factoryLSP8Address: string
    propertyID: string
    rawJsonData: any
    mintedAssetAddress: string
    fetchPerkMetadata?: boolean
    fetchPerkKeys?: boolean
    fetchperkPropertyIDData?: boolean
  }): Promise<{
    perkMetadataURI?: string
    perkKeys?: string[]
    perkPropertyIDData?: string[]
    error?: string
    action?: string
  }> => {
    try {
      const jsonData = JSON.parse(rawJsonData)
      console.log('jsonData:', jsonData)
      const { action, assetAddress, perkName, key } = jsonData

      // If the action is PerkAdded, we need to fetch the perk metadata URI, the perk keys, and the perk property ID data and then pass teh data back
      if (action === 'PerkAdded') {
        let perkMetadataURI: string
        let perkKeys: string[] = []
        let perkPropertyIDData: string[] = []

        // Fetch the Perk Metadata JSONURL from the key
        // Encode the key to get the metadata key
        // @dev - disabled
        // if (fetchPerkMetadata) {
        //   throw new Error('fetchPerkMetadata is disabled')
        //   // TODO: his one returns JSONURL so we will disable that and reject those for this version until I am sure everything is working or can come back to it.
        //   //   try {
        //   //     // Encode the key to get the metadata key
        //   //     const LSP2Key = await LSP2Service.encodeKeyName({
        //   //       LSP2Schema: LSP2PerkSchema as ERC725JSONSchema[],
        //   //       assetAddress: assetAddress,
        //   //       keyName: 'Perks:<AssetAddress>:<PerkName>:Metadata',
        //   //       dynamicKeyParts: [mintedAssetAddress, perkName],
        //   //     })
        //   //     console.log('LSP2Key:', LSP2Key)

        //   //     // Fetch the metadata
        //   //     const assetMetadataURI = await AssetService._getData(
        //   //       factoryLSP8Address,
        //   //       LSP2Key,
        //   //     )

        //   //     let {value, } = assetMetadataURI
        //   //     console.log('value:', value)
        //   //     if (Array.isArray(value)) {
        //   //       value = value[0]
        //   //     }
        //   //     if
        //   //     perkMetadataURI = value
        //   //     console.log('assetMetadataURI:', assetMetadataURI)
        //   //     // perkMetadataURI = assetMetadataURI
        //   //     return {
        //   //       perkMetadataURI: assetMetadataURI,
        //   //       perkKeys,

        //   //       perkPropertyIDData,
        //   //     }
        //   //   } catch (error) {
        //   //     console.log('error:', error)
        //   //   }
        // }

        if (fetchPerkKeys) {
          try {
            // fetch the perkKeys
            let key = EOAManagerService.web3.utils.keccak256(
              assetAddress + perkName,
            )

            const perkPropertyKeysKey = await LSP2Service.encodeKeyName({
              LSP2Schema: LSP2PerkSchema as ERC725JSONSchema[],
              assetAddress: assetAddress,
              keyName: CONSTANTS.PERK_SCHEMA_KEYS.PerkPropertyKeys, //'Perks:<AssetAddress>:<PerkName>:PerkPropertyKeys',
              dynamicKeyParts: key,
            })

            const fetchedPerkKeys = await AssetService._getData(
              factoryLSP8Address,
              perkPropertyKeysKey,
            )
            console.log('fetchedPerkKeys:', fetchedPerkKeys)

            if (!fetchedPerkKeys) {
              // Do nothing if the perk keys are not found
            } else if (fetchedPerkKeys.value === 'string') {
              // If the value is a string, then it is the first entry in the array
              const value = fetchedPerkKeys.value
              perkKeys.push(value)
            } else if (typeof fetchedPerkKeys.value === 'string') {
              // If the value is a string[], then it is an array of strings
              const value = fetchedPerkKeys.value
              console.log('value:', value)
              for (let i = 0; i < value.length; i++) {
                const element = value[i]
                perkKeys.push(element)
              }
            } else if (typeof fetchedPerkKeys.value === 'object') {
              console.log('fetchedPerkKeys.value:', fetchedPerkKeys.value)
              if (Array.isArray(fetchedPerkKeys.value)) {
                // If the value is an object, then it is an array of objects
                const value = fetchedPerkKeys.value
                console.log('value:', value)
                for (let i = 0; i < value.length; i++) {
                  const element = value[i]
                  perkKeys.push(element)
                }
              }
            } else {
              throw new Error(
                `RefereshRequiredStrategy: Error getting perk keys, invalid data type found in perk keys ${typeof fetchedPerkKeys.value}`,
              )
            }
          } catch (error) {
            console.log('Fetch perk keys error:', error)
          }
        }
        if (fetchperkPropertyIDData) {
          console.log('assetAddress:', assetAddress)
          console.log('perkName:', perkName)

          const perkNameAddressbytes32 = EOAManagerService.web3.utils.keccak256(
            assetAddress + perkName,
          )
          let perkID = '1'
          let perkIDHex = '0x' + perkID.padStart(64, '0')
          console.log('perkIDHex', perkIDHex)
          try {
            // const perkPropertyIDKey = await LSP2Service.encodeKeyName({
            //   LSP2Schema: LSP2PerkSchema as ERC725JSONSchema[],
            //   assetAddress: assetAddress,
            //   keyName: CONSTANTS.PERK_SCHEMA_KEYS.PerkPropertyID, //'Perks:<bytes32>:<bytes32>',
            //   dynamicKeyParts: [
            //     EOAManagerService.web3.utils.keccak256(assetAddress + perkName),
            //     propertyID,
            //   ],
            // })
            // console.log('perkPropertyIDKey:', perkPropertyIDKey)

            // const perkPropertyKeysKey = await LSP2Service.encodeKeyName({
            //   LSP2Schema: LSP2PerkSchema as ERC725JSONSchema[],
            //   assetAddress: assetAddress,
            //   keyName: CONSTANTS.PERK_SCHEMA_KEYS.PerkPropertyID, //'Perks:<AssetAddress>:<PerkName>:PerkPropertyKeys',
            //   dynamicKeyParts: [key, id],
            // })

            const perkPropertyIDKey = await LSP2Service.encodeKeyName({
              LSP2Schema: LSP2PerkSchema as ERC725JSONSchema[],
              assetAddress: assetAddress,
              keyName: CONSTANTS.PERK_SCHEMA_KEYS.PerkPropertyID,
              dynamicKeyParts: [perkNameAddressbytes32, perkIDHex],
            })

            console.log('perkNameAddressbytes32:', perkNameAddressbytes32)
            const perkPropertyIDDataReturn = await AssetService._getData(
              assetAddress,
              perkPropertyIDKey,
            )

            console.log('perkPropertyIDDataReturn:', perkPropertyIDDataReturn)
            perkPropertyIDData.push(perkPropertyIDDataReturn.value as string)

            let value = perkPropertyIDDataReturn.value as string[]
            console.log('perkPropertyIDDataReturn value:', value)

            return {
              perkMetadataURI: perkMetadataURI,
              perkKeys: perkKeys,
              perkPropertyIDData: perkPropertyIDData,
              action: action,
            }
          } catch (error) {
            console.log('Fetch perk property ID data error:', error)
            return { error: error }
          }
        }
      } else {
        // console.log('Invalid action type:', action)
        return { error: 'Invalid action type', action: action }
      }
    } catch (error) {
      console.log('Error fetching all perk key data:', error)
      return { error: error }
    }
  }

  // This function is used to handle the RefreshRequired event
  // It will create or update the asset in the database as well as create the Perk Table entry for the asset if it does not already exist, adding the new perk to the perk table
  public async handleEvent(
    processedLog: IProcessedLogs,
    transactionData: any,
    eventData: any,
  ): Promise<void> {
    try {
      // Expect json data to be in the eventData
      if (!eventData.jsonData) {
        console.log('JSON data not found in event data')
        return
      }
      // Validate the JSON data in the event to make sure it matches our schema
      let valid = await this._validateJSON(
        eventData.jsonData,
        EVENT_SIGNATURE.RefreshRequired,
      )
      if (!valid) {
        return
      }
      const obj = JSON.parse(eventData.jsonData)

      const { action, assetAddress, perkName, key } = obj

      // convert the key to a string

      console.log('keyString:', key)

      // Slice the last 32 bytes off of the key to get the perk property ID
      // remoe the first two (0x)
      // We will get these from teh conrtact as a nonce in the future
      const propertyID = CONSTANTS.TEST_PROPERTY_ID

      console.log('propertyID.length:', propertyID.length)
      // if (propertyID.length < 64) {
      //   throw new Error(
      //     'Invalid propertyID length - too long, should be 64 bytes its length is: ' +
      //       propertyID.length,
      //   )
      // }
      // if (propertyID.length > 64) {
      //   throw new Error(
      //     'Invalid propertyID length - too long, should be 64 bytes its length is: ' +
      //       propertyID.length,
      //   )
      // }

      console.log('propertyID:', propertyID)
      // convert from bytes32 to string

      const factoryLSP8Address = transactionData.to

      // const ReturnedLSP2Data = await AssetService.getLSP2Data(assetAddress)
      // console.log('ReturnedLSP2Data:', ReturnedLSP2Data)

      const result = await this._fetchAllPerkKeyData({
        factoryLSP8Address: factoryLSP8Address,
        propertyID: propertyID,
        rawJsonData: eventData.jsonData,
        mintedAssetAddress: assetAddress,
      })
      console.log('fetchAllPerkKeyData result:', result)

      // Loop through each of the keys that we support indexing
      const assetMetadataURI = await AssetService._getData(
        factoryLSP8Address,
        LSP2KEY_CONSTANTS.LSP4Metadata,
      ).catch(error => {
        return undefined // ignore, not all assets have metadata
      })

      let metadata = {
        description: undefined,
        image: undefined,
        external_url: undefined,
        name: undefined,
        attributes: undefined,
      } as any // Fall back to empty object if no metadata is found

      console.log('assetMetadataURI:', assetMetadataURI)

      if (typeof assetMetadataURI === 'string') {
        // LSP2Service.decodeData(assetMetadataURI)
        metadata = await this._fetchMetadata(assetMetadataURI)
      }
      const { description, image, external_url, name, attributes } = metadata
      const { perkMetadataURI, perkKeys, perkPropertyIDData, error } = result
      if (error) {
        throw new Error(
          "Error fetching perk's metadata for address: " +
            factoryLSP8Address +
            'and key:' +
            key +
            +' error:' +
            error,
        )
      }
      console.log('perkMetadataURI:', perkMetadataURI)
      console.log('perkKeys:', perkKeys)
      console.log('perkPropertyIDData:', perkPropertyIDData)

      // Create the assets in the database, or update it if it already exists and has an older block number
      // Create the Perk Table entry for the Asset
      const perk: IPerk = {
        perkName: perkName,
        assetAddress: assetAddress,
        perkMetadataURI: perkMetadataURI,
        perkKeys: perkKeys,
        perkPropertyIDData: perkPropertyIDData,
      }

      // Creeate the asset
      const asset: IAsset = {
        address: assetAddress,
        metadataURI: assetMetadataURI,
        description,
        image,
        external_url,
        name,
        owner: transactionData.from,
        attributes: JSON.stringify(attributes),
      }

      const createdAsset = await AssetTableService.createAsset(asset)

      // After creating the asset, create the perk
      const createdPerk = await Perk.create({
        perkName: perk.perkName,
        assetAddress: asset.address,
        perkMetadataURI: perk.perkMetadataURI,
        perkKeys: perk.perkKeys,
        perkPropertyIDData: perk.perkPropertyIDData,
      })

      // // Optionally, if you want to directly associate the created perk with the created asset
      // // assuming 'createdAsset' is the instance of the created asset
      // await createdAsset.addPerk(createdPerk)

      if (!createdAsset) {
        console.error('Error creating asset')
        throw new Error('Error creating asset')
      }
    } catch (error) {
      if (error === 'Invalid JSON data') {
        return
      } else {
        console.error('RefreshRequiredStrategy error:', error)
      }
    }
  }
}

export default RefreshRequiredStrategy
