import { PerkMetadataJSON } from '../types/PerkMetadataJSON'

// this interface defines the type of the params object in the callContract function in EOAManagerService
export interface IRedeemRequest {
  assetAddress: string
  perkName: string
  metadata: PerkMetadataJSON
}
