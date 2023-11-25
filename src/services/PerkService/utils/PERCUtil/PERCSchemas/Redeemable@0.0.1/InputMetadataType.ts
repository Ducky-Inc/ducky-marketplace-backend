/*
{
perkName: perkName,
description:string // Description of the perk 
associatedAsset:string // Address of the Minted Asset that this perk is associated with/ tracking for 
creator:{
    name:string //The creator of the perk, this is the address that will be able to admin the perk and add new perk properties through the perk service
    contactInfo:string // The main contact for the perk, this is the address that will be able to update the perk metadata as well as the perk properties
}, //The creator of the perk, this is the address that will be able to admin the perk and add new perk properties through the perk service
mainContact: string // The main contact for the perk, this is the address that will be able to update the perk metadata as well as the perk properties
additionalDetails, // This is a key value pair object that will contain any additional details that the perk creator wants to add to the perk
perkKeys, // This is an array of the perk propertyID's and schemaTypes@versions that this perk uses
perkProperties, // This is an object that contains the perk propertyID's and schemaTypes@versions that this perk uses
}
*/
//
// On chain we need:
// Perks:<AssetAddress>:><CreatorAddress>:<PerkName>:<PerkPropertyID>

/* Representation of the data structure we will use to store the perk data on chain:
Perks:{
  $AssetAddress: {
    $CreatorAddress: {
      $PerkName: {
        Metadata: $MetadataURI,
        perkKeys: [[$PerkPropertyID: $PerkSchemaType@Version], ...],
        $PerkPropertyID: Redeemable@0.0.1 or any other PERC Schema
} } } } }
*/

// Common Base PERCMetadata for off-chain Ducky PERC Metadata
// @dev - this is the base type for all PERC Metadata types (all schemas and versions)
export type BasePERCMetadataType = {
  perkName: string
  description: string
  associatedAsset: string
  creator: {
    name: string
    contactInfo: string
    address: string
  }
  mainContact: string
  additionalDetails: {
    [key: string]: any
  }
}

// --- Off-Chain PERCProperties for Redeemable@0-0-1 ---
export type OffChainPERCPropertiesRedeemableType = {
  redeemed: boolean
}

// --- On-Chain PERCProperties for Redeemable@0-0-1 ---
export type OnChainPERCPropertyRedeemableType = {
  redeemed: boolean
}

// --- Input Types --- -- Input for encodeMetadata function
// PERCMetadata with the perkKeys and perkProperties added to the base type
// Off-Chain Perk Metadata type Interface for Redeemable@0-0-1, adds OffChainPERCPropertiesRedeemableType to the base type PERCMetadata to give the full type for off-chain PERC Metadata of Redeemable@0-0-1 Schema
export type InputPERCMetadataType = BasePERCMetadataType & {
  perkKeys: [string, string][] // This is an array of the perk propertyID's and schemaTypes@versions that this perk uses
  perkProperties: [string, OffChainPERCPropertiesRedeemableType][] // This is an object that contains the perk propertyID's and schemaTypes@versions that this perk uses
}

// --- Output Types ---
// @dev - defines the on-chain data structure output of the encodeMetadata function this data will be stored off-chain and referenced on-chain
export type OutputOffChainType = {
  perkName: string
  description: string
  associatedAsset: string
  creator: {
    name: string
    contactInfo: string
    address: string
  }
  mainContact: string
  additionalDetails: {
    [key: string]: any
  }
  perkKeys: [string, string][] // This is an array of the perk propertyID's and schemaTypes@versions that this perk uses
  perkProperties: [string, OffChainPERCPropertiesRedeemableType][]
}

// @dev - defines the on-chain data structure output of the encodeMetadata function
// This is the type of the metadata that will be passed in to the encodeMetadata function
// It is specific to the schema version for Redeemable@0.0.1
// This contains all the data that will be encoded in to the PERC Metadata on and off chain
export type OutputOnChainType = {
  metadata: string // This is the URI of the metadata that will be uploaded to IPFS
  perkKeys: [string, string][] // This is an array of the perk propertyID's and schemaTypes@versions that this perk uses
  perkProperties: [string, OnChainPERCPropertyRedeemableType][] // This is an object that contains the perk propertyID's and schemaTypes@versions that this perk uses
}

export type OutputOnChainTypeEncoded = {
  metadata?: string // This is the URI of the metadata that will be uploaded to IPFS
  perkKeys: string[] // This is an array of the perk propertyID's and schemaTypes@versions that this perk uses
  perkProperties: string[] // This is a stringified object that contains the perk propertyID's and the perk property values object as a string
}

export type newOutputOnChainTypeEncoded = {
  metadata?: string // This is the URI of the metadata that will be uploaded to IPFS
  perkKeys: string[] // This is an array of the perk propertyID's and schemaTypes@versions that this perk uses
  perkProperties: string[] // This is a stringified object that contains the perk propertyID's and the perk property values object as a string
}
