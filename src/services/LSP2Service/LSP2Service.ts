import ERC725, { ERC725JSONSchema } from '@erc725/erc725.js'
import {
  DecodeDataInput,
  DecodeDataOutput,
  EncodeDataInput,
} from '@erc725/erc725.js/build/main/src/types/decodeData'

import { CONSTANTS } from '../../constants/constants'
import { EncodeDataReturn } from '@erc725/erc725.js/build/main/src/types'

import LSP2PerkSchema from '../../contracts/DuckyAsset/_Schemas/LSP2PerkSchema/LSP2PerkSchema.json'
import { GetDataDynamicKey } from '@erc725/erc725.js/build/main/src/types/GetData'
import web3 from 'web3'
import EOAManagerService from '../EOAManagerService/EOAManagerService'
import e from 'express'

export interface LSP2Service_getDataReturn {
  parsedJSON: Array<any>
  rawJSON: any
  rawResponse: any
  address: string
  key: string
}

//TODO: Make this call three different key calling functions at the same time and return the result of them all in a formatted way.
class LSP2Service {
  public encodeData = async ({
    assetAddress,
    keyName,
    value,
    dynamicKeyParts,
    LSP2Schema = LSP2PerkSchema as ERC725JSONSchema[],
  }: {
    LSP2Schema?: ERC725JSONSchema[]
    assetAddress: string
    keyName: string
    value?: string[]
    dynamicKeyParts?: string[]
  }): Promise<EncodeDataReturn> => {
    const erc725 = new ERC725(
      LSP2Schema as ERC725JSONSchema[],
      assetAddress,
      CONSTANTS.RPC_URL,
    )

    const data: EncodeDataInput[] = [
      {
        keyName,
        value,
        dynamicKeyParts,
      },
    ]

    const encodedData = erc725.encodeData(data)
    return encodedData
  }
  public encodeKeyName = async ({
    LSP2Schema = LSP2PerkSchema as ERC725JSONSchema[],
    assetAddress,
    keyName,
    dynamicKeyParts,
  }: {
    LSP2Schema?: ERC725JSONSchema[]
    assetAddress: string
    keyName: string
    dynamicKeyParts?: string[] | string
  }): Promise<string> => {
    console.log('LSP2Service: dynamicKeyParts', dynamicKeyParts)
    console.log('LSP2Service: keyName', keyName)
    //Perks:<AssetAddress>:<PerkName>:PerkPropertyKeys
    // If it's already encoded we don't want to encode it again, so return the keyName
    if (keyName.startsWith('0x')) {
      return keyName
    }
    // if it's 64 characters long, it's already encoded presumably,
    // this may be a bad assumption and cause a bug but it's a good starting point
    if (keyName.length === 64) {
      return keyName
    }

    const encodedKey = ERC725.encodeKeyName(keyName, dynamicKeyParts)
    console.log('LSP2Service: encodedKey', encodedKey)
    return encodedKey
  }

  public async decodeData({
    assetAddress,
    data,
    LSP2Schema = LSP2PerkSchema as ERC725JSONSchema[],
  }: {
    LSP2Schema: ERC725JSONSchema[]
    assetAddress: string
    data: DecodeDataInput[]
  }): Promise<{ [key: string]: any }> {
    try {
      const erc725 = new ERC725(
        LSP2Schema as ERC725JSONSchema[],
        assetAddress,
        CONSTANTS.RPC_URL,
      )

      const decodedData = erc725.decodeData(data, LSP2Schema)
      return decodedData
    } catch (error) {
      return Promise.reject(error)
    }
  }
  public _getData = async ({
    contractAddress,
    key,
    dynamicKeyParts = undefined,
    LSP2Schema = LSP2PerkSchema as ERC725JSONSchema[],
    encodeBoolean = false,
  }: {
    contractAddress: string
    key: string
    dynamicKeyParts?: string | string[] | undefined
    LSP2Schema?: ERC725JSONSchema[]
    encodeBoolean?: boolean
  }): Promise<LSP2Service_getDataReturn> => {
    // TODO: fix any
    try {
      const erc725 = new ERC725(
        LSP2Schema as ERC725JSONSchema[],
        contractAddress,
        CONSTANTS.RPC_URL,
      )

      // encode the key
      console.log(
        'LSP2Service _getData - attempting to call erc725.getData on key after encoding if dynamic array was passed:',
        key,
      )
      console.log('LSP2Service _getData:, ')

      // Duplicate the key so we can modify it without affecting the original
      let encodedKey = key
      // Declare a variable to hold the data
      let data: Array<any> | Object

      // If the encodingBoolean is true, we will encode the key as long as the dynamicKeyParts are defined
      if (encodeBoolean === true) {
        throw new Error(
          'TODO LSPService: Impliment this to match the output type',
        )

        // // If the dynamicKeyParts are not defined, we can't encode the key
        // if (!dynamicKeyParts) {
        //   throw new Error(
        //     'LSP2Service _getData: dynamicKeyParts must be defined if encodeBoolean is true',
        //   )
        // } else {
        //   console.log('LSP2Service _getData: dynamicKeyParts', dynamicKeyParts)
        //   // Encode the key with the dynamicKeyParts because they are defined and the encodeBoolean is true
        //   encodedKey = erc725.encodeKeyName(key, dynamicKeyParts)
        // }
      }
      if (dynamicKeyParts === undefined) {
        throw new Error(
          'TODO LSPService: Impliment this to match the output type',
        )
        // // if they successfully called getData() without dynamicKeyParts and encodeBoolean is false
        // // The caller has not passed in dynamicKeyParts and asked us to pass it without encoding
        // // It's perhaps a pre-prepared key for getData(), however they got it we will use it
        // // data = await erc725.getData(key)
        // // This wont't actually work, so we will just call the contracts getData() directly
        // const txHash = await EOAManagerService._call({
        //   contractAddress: contractAddress,
        //   methodName: 'getData',
        //   params: {
        //     types: ['bytes32'],
        //     values: [key],
        //   },
        // })
        // // wait for the transaction to be mined
        // const result = await EOAManagerService.waitForTransactionReceipt(txHash)
        // // get the logs from the transaction receipt
        // if (!result) {
        //   throw new Error('Error getting transaction receipt')
        // }
        // const logs = result.logs
        // // decode the logs
        // const decodedLogs = EOAManagerService.web3.eth.abi.decodeLog(
        //   [
        //     {
        //       type: 'bytes',
        //       name: 'data',
        //     },
        //   ],
        //   logs[0].data,
        //   logs[0].topics,
        // )
        // // decode the data
        // const decodedData = web3.utils.hexToUtf8(decodedLogs.data)
        // // parse the data
        // data = JSON.parse(decodedData)
        // return data
      } else if (dynamicKeyParts !== undefined) {
        console.warn(
          'LSP2Service _getData - dynamicKeyParts without boolean used :',
          dynamicKeyParts,
          "are you sure you don't want to encode the key?",
          'Defaulting to discarding the dynamicKeyParts and passing the key as is to erc725.getData()',
        )
        try {
          // verify it's bytes32
          const isBytes32 = EOAManagerService.web3.utils.isHexStrict(key)
          if (!isBytes32) {
            throw new Error('key is not bytes32')
          } else {
            console.log('LSP2Service _getData: key', key)
          }

          console.log('LSP2Service _getData: key', key)
          const fetchedData = await EOAManagerService.callMethod({
            contractAddress: contractAddress,
            methodName: 'getData',
            params: {
              types: ['bytes32'],
              values: [key],
            },
          })

          if (!fetchedData) {
            throw new Error('Error getting data')
          }
          console.log(
            'LSP2Service _getData: txHash data',
            fetchedData.substring(2),
          )
          // decode the data, taking the 0x off the front
          const decodedData = web3.utils.hexToUtf8(fetchedData.substring(2))
          let dataString = decodedData
          let dataArray: string[] = []
          //remove the whitespace
          console.log('LSP2Service _getData: decodedData', decodedData)
          dataString.replace(/\s/g, '') // remove whitespace from the string
          //and anything up to the first [ and put it in an array
          console.log('LSP2Service _getData: decodedData', dataString)

          // remove trailing whitespace and characters after the last ]
          dataString = dataString.substring(0, dataString.lastIndexOf(']') + 1)

          //  remove anything before the first [ and put it in an array
          dataString = dataString.substring(dataString.indexOf('['))
          dataArray.push(dataString)

          // // convert the string to an array
          // // for each item in the the datastring, split it on the comma and push it to the array as an array inside the array
          // dataString.split(',').forEach(item => {
          //   dataArray.push(item.split(','))
          // })

          console.log('LSP2Service _getData: decodedData', dataArray)

          console.log('LSP2Service _getData: dataArray', dataArray)
          // parse the data
          // for each item in the data array, parse it
          // then push it to a new parsedData array
          let parsedData: any = []
          dataArray.forEach(item => {
            parsedData.push(JSON.parse(item))
          })

          let result: LSP2Service_getDataReturn = {
            parsedJSON: parsedData,
            rawJSON: dataArray,
            rawResponse: fetchedData,
            address: contractAddress,
            key: key,
          }

          if (!result.parsedJSON) {
            throw new Error('Error parsing data')
          }

          // data = JSON.parse(decodedData)
          console.log(JSON.stringify(result))
          return result
        } catch (error) {
          console.error('LSP2Service _getData - else -  error:', error)
          return Promise.reject(error)
        }
      }
      console.log('LSP2Service: data', data)
      // return data Should return the result of the three calls here
    } catch (error) {
      console.error('LSP2Service _getData error:', error)
      return Promise.reject(error)
    }
  }
}

export default new LSP2Service()
