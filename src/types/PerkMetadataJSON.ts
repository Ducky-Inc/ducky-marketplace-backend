export type PerkMetadataJSON = {
  perkName?: string
  description?: string
  termsOfUse?: string
  validityPeriod?: {
    startDate: Date
    endDate: Date
  }
  eligibilityCriteria?: string
  howToRedeem?: string
  associatedAsset?: string
  creator: {
    name: string
    contactInfo?: string
  }
  additionalDetails?: Object
}
