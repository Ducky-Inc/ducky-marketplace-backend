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
  // enforce the key to be a string of 64 characters (32 bytes)
  key: string // '0x6a3c79356cb1413ef6bff15a0785660f0b67baafe0d0e269b68750e0930c2398'
  // key: string // '0x6a3c79356cb1413ef6bff15a0785660f0b67baafe0d0e269b68750e0930c2398'
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
    LSP2keytoFetch,
    rawJsonData,
    mintedAssetAddress,
    fetchPerkMetadata = false,
    fetchPerkKeys = false,
    fetchperkPropertyIDData = true,
  }: {
    factoryLSP8Address: string
    LSP2keytoFetch: string
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
    const _callObject = {
      factoryLSP8Address,
      LSP2keytoFetch,
      rawJsonData,
      mintedAssetAddress,
      fetchPerkMetadata,
      fetchPerkKeys,
      fetchperkPropertyIDData,
    }

    try {
      const jsonData = JSON.parse(rawJsonData)
      console.log('RefreshRequiredStrategy: jsonData:', jsonData)
      const { action, assetAddress, perkName, key } = jsonData

      // If the action is PerkAdded, we need to fetch the perk metadata URI, the perk keys, and the perk property ID data and then pass teh data back
      if (action === '!PerkAdded') {
        return {
          error: 'Invalid action type',
          action: action,
        }
      } else if (action === 'PerkAdded') {
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
          console.warn('fetchPerkKeys is disabled')
          // try {
          //   // We have this json data decoded from the event, it includes:
          //   // an action (should be PerkAdded),
          //   // assetAddress - the address of the unique asset, not the contract address of the factory,
          //   //  perkName - the name of the perk,
          //   // and key - the key of the perk, which is a 32 byte hex string (64 characters) representing the property ID
          //   const { action, assetAddress, perkName, key } = jsonData
          //   // fetch the perkKeys (32 bit hex Incrementing for each added perk per perk name+asset hash)
          //   // call the view function on the contract to get the perk keys, passing the asset address and perk name hashed
          //   // for now we just get it from constants
          //   // We could use the emitted event to get the perk key as well
          //   const perkID = CONSTANTS.TEST_PROPERTY_ID
          //   console.log(
          //     'RefreshRequired FetchPerkKeys: Fetching the perk key LSP2 dynamic key built from the asset address and perk name hashed, along with the property ID ',
          //   )
          //   // let key = EOAManagerService.web3.utils.keccak256(
          //   //   assetAddress + perkName,
          //   // )

          //   // const perkPropertyKeysKey = await LSP2Service.encodeKeyName({
          //   //   LSP2Schema: LSP2PerkSchema as ERC725JSONSchema[],
          //   //   assetAddress: assetAddress,
          //   //   keyName: propertyID,
          //   // })

          //   const fetchedPerkKeys = await AssetService._getData(
          //     factoryLSP8Address,
          //     key,
          //   )
          //   console.log(
          //     'RefreshRequired FetchPerkKeys: fetchedPerkKeys:',
          //     fetchedPerkKeys,
          //   )

          //   if (!fetchedPerkKeys) {
          //     // Do nothing if the perk keys are not found
          //   } else if (fetchedPerkKeys.value === 'string') {
          //     // If the value is a string, then it is the first entry in the array
          //     const value = fetchedPerkKeys.value
          //     perkKeys.push(value)
          //   } else if (typeof fetchedPerkKeys.value === 'string') {
          //     // If the value is a string[], then it is an array of strings
          //     const value = fetchedPerkKeys.value
          //     console.log('RefreshRequired FetchPerkKeys: value:', value)
          //     for (let i = 0; i < value.length; i++) {
          //       const element = value[i]
          //       perkKeys.push(element)
          //     }
          //   } else if (typeof fetchedPerkKeys.value === 'object') {
          //     console.log(
          //       'RefreshRequired FetchPerkKeys: fetchedPerkKeys.value:',
          //       fetchedPerkKeys.value,
          //     )
          //     if (Array.isArray(fetchedPerkKeys.value)) {
          //       // If the value is an object, then it is an array of objects
          //       const value = fetchedPerkKeys.value
          //       console.log('value:', value)
          //       for (let i = 0; i < value.length; i++) {
          //         const element = value[i]
          //         perkKeys.push(element)
          //       }
          //     }
          //   } else {
          //     throw new Error(
          //       `RefreshRequired FetchPerkKeys: Error getting perk keys, invalid data type found in perk keys ${typeof fetchedPerkKeys.value}`,
          //     )
          //   }
          // } catch (error) {
          //   console.log(
          //     'RefreshRequired FetchPerkKeys: Fetch perk keys error:',
          //     error,
          //   )
          // }
        }
        if (fetchperkPropertyIDData) {
          const LSP2Key = LSP2keytoFetch
          console.log(
            'attempting a refresh required fetch on LSP2Key:',
            LSP2Key,
            'for assetAddress:',
            assetAddress,
            'and perkName:',
            perkName,
          )
          try {
            const perkPropertyIDDataReturn = await AssetService._getData(
              assetAddress,
              LSP2Key,
            )

            // If we get here, we have successfully fetched the perk property ID data from the contract
            console.log(
              'RefreshRequiredStrategy fetchperkPropertyIDData: perkPropertyIDDataReturn:',
              perkPropertyIDDataReturn,
            )

            // if it's a string or a string[] we can just push it to the array
            // otherwise we need to figure out JSONURI and fetch it, we can use fetchData to save time but we still need to encode it
            let fetchedValue: any = perkPropertyIDDataReturn

            // if (typeof fetchedValue === 'string') {
            //   perkPropertyIDData.push(fetchedValue)
            // } else if (Array.isArray(fetchedValue)) {
            //   // Most likely path as we are converting it to a string array
            //   for (let i = 0; i < fetchedValue.length; i++) {
            //     const element = fetchedValue[i]
            //     if (typeof element === 'string') {
            //       perkPropertyIDData.push(element)
            //     }
            //     if (typeof element === 'object') {
            //       // If the element is an object, then it is an array of objects or Arrays of objects
            //       // We need to iterate through each element and push it to the array
            //       const value = fetchedValue[i]
            //       console.log('value:', value)
            //       for (let i = 0; i < value.length; i++) {
            //         const element = value[i]
            //         perkPropertyIDData.push(element)
            //       }
            //     }
            //   }
            // }

            let value = perkPropertyIDDataReturn
            console.log(
              'RefreshRequiredStrategy fetchperkPropertyIDData: perkPropertyIDDataReturn value:',
              value,
            )

            return {
              perkMetadataURI: perkMetadataURI,
              perkKeys: perkKeys,
              perkPropertyIDData: perkPropertyIDData,
              action: action,
            }
          } catch (error) {
            console.log(
              'RefreshRequiredStrategy: Fetch perk property ID data error:',
              error,
            )
            return { error: error }
          }
        }
      } else {
        // console.log('Invalid action type:', action)
        return { error: 'Invalid action type', action: action }
      }
    } catch (error) {
      console.log(
        'RefreshRequiredStrategy: Error fetching all perk key data:',
        error,
      )
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
      if (!eventData.jsonData) {
        console.log(
          eventData.jsonData,
          'RefreshRequiredHandler:  JSON data not found in event data',
        )
        console.log(
          'RefreshRequiredHandler:  JSON data not found in event data',
        )
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
      const { action, assetAddress, perkName, key } =
        obj as IRefreshRequiredEvent
      // We have this json data decoded from the event, it includes:
      // - an action (should be PerkAdded),
      // - assetAddress - the address of the unique asset, not the contract address of the factory,
      // - perkName - the name of the perk,
      // - and key - the key of the perk, which is an LSP2 data key "0x7f7c95d7ab7801b717538c478a627efc2d9eb87185b2f86739b250cca0bc12e9" for example

      // Validate that the data key is correct, otherwise it might be an earlier schema version of RefreshRequired
      // That we do not support

      // Validate the key is a valid 64 byte hex string
      const validateKey = () => {
        if (key.startsWith('0x')) {
          console.log('RefreshRequired: Key starting with 0x')
          let keyString = key.slice(2)
          if (keyString.length !== 64) {
            throw new Error(
              'RefreshRequired validateKey: Invalid key length - should be 64 bytes, its length is: ' +
                key.length,
            )
          }
        }
        // if the action is not perkadded we will return
        if (action !== 'PerkAdded') {
          throw new Error(
            'RefreshRequired validateKey:Invalid action type:' + action,
          )
          return
        }
      }

      let isValidKey = false
      try {
        validateKey()
        isValidKey = true
      } catch (error) {
        console.log('RefreshRequiredHandler: Invalid key:', error)
        return
      }

      const propertyID = CONSTANTS.TEST_PROPERTY_ID
      console.log('RefreshRequiredHandler: keyString:', key)
      console.log(
        'RefreshRequiredHandler: propertyID.length:',
        propertyID.length,
      )
      console.log('RefreshRequiredHandler: propertyID:', propertyID)

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

      // convert from bytes32 to string

      const factoryLSP8Address = transactionData.to

      // const ReturnedLSP2Data = await AssetService.getLSP2Data(assetAddress)
      // console.log('ReturnedLSP2Data:', ReturnedLSP2Data)

      // If the key is valid, we can use it, otherwise we will use the default property ID

      let propertyIDLSP2Key = key
      console.log(
        'RefreshRequiredHandler: propertyIDLSP2Key:',
        propertyIDLSP2Key,
      )
      if (!isValidKey) {
        // If we are using the property ID we should use the same method to encode it that we use as if we were adding it to avoid compatability encoding issues
        const kec256AddressName = EOAManagerService.web3.utils.keccak256(
          assetAddress + perkName,
        )

        propertyIDLSP2Key = await LSP2Service.encodeKeyName({
          LSP2Schema: LSP2PerkSchema as ERC725JSONSchema[],
          assetAddress: assetAddress,
          keyName: CONSTANTS.PERK_SCHEMA_KEYS.PerkPropertyID, //'Perks:<bytes32>:<bytes32>'
          dynamicKeyParts: [kec256AddressName, propertyID],
        })
        console.log(
          'RefreshRequiredHandler propertyIDLSP2Key: propertyIDLSP2Key, we are using the default property ID because the key is invalid, we will use the default property ID instead of the key that was passed in the event data' +
            propertyIDLSP2Key,
          'invalid key:',
          key,
        )
      }
      // we have two options:
      // We can get the key in the event data
      // Or we can build the key from the asset address and perk name, and the default property ID
      // the key in the event data may be invalid, so we will ignore invalid keys and only use proper keys so we don't need to manually index.
      //bOptionally we can just iterate through all the keys and get the data for each key, building the keys based on perk names and asset addresses. This is the safest option, but it is also the slowest.
      console.log(
        "RefreshRequiredHandler: Fetching all perk's metadata for address: " +
          factoryLSP8Address +
          ' and key: ' +
          propertyIDLSP2Key,
        'for assetAddress:',
        assetAddress,
      )
      const result = await this._fetchAllPerkKeyData({
        factoryLSP8Address: factoryLSP8Address,
        LSP2keytoFetch: propertyIDLSP2Key,
        rawJsonData: eventData.jsonData,
        mintedAssetAddress: assetAddress,
      })
      console.log('RefreshRequiredHandler: fetchAllPerkKeyData result:', result)

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

      // console.log('RefreshRequiredHandler: assetMetadataURI:', assetMetadataURI)

      if (typeof assetMetadataURI === 'string') {
        // LSP2Service.decodeData(assetMetadataURI)
        metadata = await this._fetchMetadata(assetMetadataURI)
      }
      const { description, image, external_url, name, attributes } = metadata
      const { perkMetadataURI, perkKeys, perkPropertyIDData, error } = result
      // console.log('RefreshRequiredHandler: key of perkPropertyIDData:', key)
      if (error) {
        if (error === 'Invalid action type') {
          // console.log(
          //   'RefreshRequiredHandler: Invalid action type, skipping event',
          // )
          return
        } else {
          throw new Error(
            "RefreshRequiredHandler: Error fetching perk's metadata for address: " +
              factoryLSP8Address +
              ' and key: ' +
              key.toString() +
              +' error: ' +
              error,
          )
        }
      }
      console.log('RefreshRequiredHandler:  perkMetadataURI:', perkMetadataURI)
      console.log('RefreshRequiredHandler: perkKeys:', perkKeys)
      console.log(
        'RefreshRequiredHandler: perkPropertyIDData:',
        perkPropertyIDData,
      )

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
