import { Request, Response } from 'express'
import * as PERCUtilLib from '../utils/PERCUtil/PERCUtil'

// This interface is used to define the request body for the addPerk endpoint
export interface IaddPerkRequest {
  assetAddress: string
  perkName: string
  data: PERCUtilLib.OutputOnChainTypeEncoded
  factoryAddress: string
  req: Request
  res: Response
  relayThroughUser?: boolean
}
