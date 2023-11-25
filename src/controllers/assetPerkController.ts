import { Request, Response } from 'express'
import { IRedeemRequest } from '../interfaces/IRedeemRequest'
import { IaddPerkRequest } from '../interfaces/IaddPerkRequest'
import web3 from 'web3'
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js'

import IpfsService from '../services/IPFSService/IPFSService'

// import the PERC Util library
import * as PERCUtilLib from '../services/PerkService/utils/PERCUtil/PERCUtil'
let PERCUtil = PERCUtilLib.PERCUtil

import perkService from '../services/PerkService/PerkService'

// Add a perk to a deployed Perk Standard Asset
export const addPerk = async (req: Request, res: Response) => {
  try {
    // extract the request body to get the logged in user, or the logged in users submitted Owner address for the perk
    // const { addPerkRequest } = req.body as { addPerkRequest: IaddPerkRequest }

    //attempt to extract the asset address, perk name, and metadata from the request in a way that won't throw an error
    // for now we will have hardcoded while we build the endpoint and envision the data structure
    let factoryAddress = process.env.DUCKY_ASSET_CONTRACT // hardcode for now until we have asset minting working, then we will get it from the request
    let assetAddress = process.env.DUCKY_ASSET_CONTRACT // This should be the address of the Asset minted from the LSP8 contract

    let perkName: string = 'Ducky Perk'
    const perkSchema: string = 'Redeemable@0.0.1'

    const metadata = await PERCUtil.createPERCMetadata({
      perkName: perkName,
      description: 'This is a perk for the Ducky Marketplace',
      mintedAssetAddress: assetAddress,
      mainContractAddress: factoryAddress,
      perkSchema: perkSchema,
      creator: {
        creatorName: 'Ducky Marketplace',
        creatorContactInfo: 'https://ducky.group/contact',
        creatorAddress: '0xBb68EEeEDA2DEdb421A4D801113241a5d76906Fc',
      },
      additionalDetails: {
        ['Alert']:
          "Message from the Ducky Marketplace's Perk!, this is a test!",
        ['Ducky Group Team Broadcast']: ['Welcome to the Ducky Marketplace!'],
        ['Redemption Instructions']: [
          'To redeem this perk, please visit the Ducky Marketplace (ducky.group/market)and click the redeem button on the perk you want to redeem. You will be prompted to sign a transaction to redeem the perk. Once you have signed the transaction, you will be able to claim the perk through the Ducky Marketplace.',
        ],
      },
    })

    // Basically a user enters the data in to the endpoint
    // we take it and pass it here to encode it, breaking the perk properties in to the correct format for the PERC Schemas that are used and passing back:
    // the data to send to the contract
    // the encoded metadata to upload to IPFS
    const {
      metadataURI,
      dataToSendToContract,
    }: {
      metadataURI: string
      dataToSendToContract: PERCUtilLib.OutputOnChainTypeEncoded
    } = await PERCUtil.encodeMetadata(metadata)

    console.log('dataToSendToContract', dataToSendToContract)
    console.log('encodedMetadata', metadataURI)

    // pass the request to the perk service to add the perk
    await perkService.addPerk({
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
