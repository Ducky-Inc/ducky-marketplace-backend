import { Request, Response } from 'express'
import { IRedeemRequest } from '../interfaces/IRedeemRequest'
import { IaddPerkRequest } from '../interfaces/IaddPerkRequest'
import web3 from 'web3'
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js'

import IpfsService from '../services/IPFSService/IPFSService'

// import the PERC Util library
import * as PERCUtilLib from '../utils/PERCUtil/PERCUtil'
let PERCUtil = PERCUtilLib.PERCUtil

import perkService from '../services/PerkService/PerkService'

const checkRedemptionRequest = (req: Request): boolean => {
  const { redeemRequest } = req.body as { redeemRequest: IRedeemRequest }
  const { assetAddress, perkName, metadata } = redeemRequest
  return (
    typeof assetAddress === 'string' &&
    typeof perkName === 'string' &&
    typeof metadata === 'string'
  )
}

// Add a perk to a deployed asset
export const addPerk = async (req: Request, res: Response) => {
  try {
    //attempt to extract the asset address, perk name, and metadata from the request in a way that won't throw an error
    // for now we will have hardcoded while we build the endpoint and envision the data structure
    let factoryAddress = '0x36C5207240604B96272BBF66e5fE6104FfDA7dc9'
    let assetAddress = '0x36C5207240604B96272BBF66e5fE6104FfDA7dc9'

    let perkName = 'Ducky Perk'
    // generate a perk propertyID for the perk
    // we will use keccak256(utf8) as the method (from ethers.js)
    const perkSchema: string = 'Redeemable@0.0.1'
    const perkPropertyIDString = web3.utils.keccak256(perkName + perkSchema)
    const perkPropertyID = ERC725.encodeKeyName(
      'Perks:<AssetAddress>:<PerkName>:<perkPropertyID>',
      [assetAddress, perkName, perkPropertyIDString],
    )

    // An example of the PERC Metadata that we will encode
    const metadata: PERCUtilLib.Metadata = {
      perkName: perkName,
      description: 'This is a perk for the Ducky Marketplace',
      associatedAsset: assetAddress,
      mainContact: '0x36C5207240604B96272BBF66e5fE6104FfDA7dc9',
      creator: {
        name: 'Ducky Marketplace',
        contactInfo: 'https://ducky.group/contact',
        address: '0xBb68EEeEDA2DEdb421A4D801113241a5d76906Fc',
      },
      additionalDetails: {
        'Hello World': 'Welcome to the Ducky Marketplace!',
        'easter egg': {
          description: 'You found the easter egg!',
          reward: 'You get a free Ducky NFT!',
          redeem: 'https://ducky.group/redeem',
          note: "if the redeem link doesn't work, please contact us at https://twitter.com/Real_DuckyGroup/",
        },
      },
      // perk propertyID's and schemaTypes@versions that this perk uses
      // We could just use LSP2 here and store everything that way but we would need to encode and decode everything and handle all that, for now we will just do this
      perkKeys: [[perkPropertyID, perkSchema]],
      perkProperties: [
        [
          perkPropertyID,
          {
            redeemed: false,
          },
        ],
      ],
    }

    // Basically a user enters the data in to the endpoint
    // we take it and pass it here to encode it, breaking the perk properties in to the correct format for the PERC Schemas that are used and passing back:
    // the data to send to the contract
    // the encoded metadata to upload to IPFS
    const { encodedMetadata, dataToSendToContract } =
      await PERCUtil.encodeMetadata(metadata, 'Redeemable@0.0.1')

    console.log('dataToSendToContract', dataToSendToContract)
    console.log('encodedMetadata', encodedMetadata)

    // pass the request to the perk service to add the perk
    const result = await perkService.addPerk({
      assetAddress,
      perkName,
      data: dataToSendToContract,
      factoryAddress,
      req,
      res,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    res.status(500).json({ error: errorMessage })
  }
}
