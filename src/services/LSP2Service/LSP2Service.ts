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
    console.log('dynamicKeyParts', dynamicKeyParts)
    console.log('keyName', keyName)
    //Perks:<AssetAddress>:<PerkName>:PerkPropertyKeys

    const encodedKey = ERC725.encodeKeyName(keyName, dynamicKeyParts)
    console.log('encodedKey', encodedKey)
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
    dynamicKeyParts,
    LSP2Schema = LSP2PerkSchema as ERC725JSONSchema[],
  }: {
    contractAddress: string
    key: string
    dynamicKeyParts?: string | string[]
    LSP2Schema?: ERC725JSONSchema[]
  }): Promise<DecodeDataOutput> => {
    const erc725 = new ERC725(
      LSP2Schema as ERC725JSONSchema[],
      contractAddress,
      CONSTANTS.RPC_URL,
    )

    // encode the key
    console.log('key', key)
    const encodedKey = erc725.encodeKeyName(key, dynamicKeyParts)
    let data
    if (dynamicKeyParts) {
      data = await erc725.getData({
        keyName: encodedKey,
        dynamicKeyParts: dynamicKeyParts,
      })
    } else {
      data = await erc725.getData(key)
    }
    console.log('data', data)
    return data
  }
}

export default new LSP2Service()
