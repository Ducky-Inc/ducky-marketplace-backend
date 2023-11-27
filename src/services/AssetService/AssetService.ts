import AssetTableService from './utils/AssetTableUtil'

import IPFSService from '../IPFSService/IPFSService'
import EOAManagerService from '../EOAManagerService/EOAManagerService'
import AssetServiceUtil from './utils/AssetServiceUtil'
import { TransactionReceipt } from 'web3'
import { EVENT_SIGNATURE } from './constants'

import { Asset, IAsset } from '../../models/AssetModel/Asset.model'
import { IProcessedLogs } from './utils/AssetServiceUtil'
import { callParams } from '../../types/callParams'

import LSP2PerkSchema from '../../contracts/DuckyAsset/_Schemas/LSP2PerkSchema/LSP2PerkSchema.json'
import { ERC725, ERC725JSONSchema } from '@erc725/erc725.js'
import { CONSTANTS } from '../../constants/constants'
import {
  DecodeDataInput,
  DecodeDataOutput,
} from '@erc725/erc725.js/build/main/src/types/decodeData'

// -- Event Handlers -- //
import RefreshRequiredStrategy from './EventHandlers/RefreshRequired/RefreshRequired'
import { LSP2KEY_CONSTANTS } from './EventHandlers/LSP2SchemaKeyConstants'
import LSP2Service from '../LSP2Service/LSP2Service'
import { URLDataWithHash } from '@erc725/erc725.js/build/main/src/types'

//Strategy Interface for handling events
export interface IEventStrategy {
  handleEvent(
    processedLog: IProcessedLogs,
    transactionData: any,
    eventData: any,
  ): Promise<void>
}

// an interface that defines what an assets shape is
// This handles the business logic for the asset table, using the AssetTableService
class AssetService {
  // Map of event signatures to their respective strategies
  private eventHandler: Map<string, IEventStrategy>
  private lastBlockScraped: number = CONSTANTS.DUCKY_ASSET_START_BLOCK // we didn't start the standard until block 1430000
  private latestBlockNumber: any
  // We want to create an asset entry for each asset we want to display on the ducky marketplace
  // Scrape the blockchain for new assets, and create them if found
  // How will we determine what an asset is on the blockchain?
  // We will use the ERC721 standard, and look for the ERC721 events that are emitted when an asset is created

  constructor() {
    //Strategy provider Map for handling events
    // Todo: refactor as this breaks Open-Closed Principle
    this.eventHandler = new Map()
    this.eventHandler.set(
      EVENT_SIGNATURE.RefreshRequired,
      new RefreshRequiredStrategy(),
    )

    // Start a function that will keep the latest block number up to date
    this._startScraping()
    this._syncBlockchainLatestBlock()
    // Start the scraper function that will keep the database up to date
  }

  // -- Rest API -- //
  public async getAssets(
    { offset, limit } = { offset: 0, limit: 10 },
  ): Promise<Asset[]> {
    // pass the call to the AssetTableService
    const assets = await AssetTableService.getAssets({
      offset: offset,
      limit: limit,
    })
    if (!assets) {
      throw new Error('No assets found')
    }
    return assets
  }

  // -- End of Rest API -- //

  // -- Helper functions for interfaces -- //

  // Pass in a LSP2KEY_CONSTANTS key to get the data for that key, otherwise get the data for the default key (metadataURI)
  public _getData = async (
    assetAddress: string,
    LSPKeyInput: string,
    dynamicKeyParts?: string[],
  ): Promise<any> => {
    if (dynamicKeyParts !== undefined) {
      //ensure that LSPKeyInput is a string, not a hex string by checking if it has a 0x in it
      if (LSPKeyInput.includes(':')) {
        throw new Error(
          'AssetService LSPKeyInput must be a key of a Schema, not a hex string',
        )
      }
    } else if (LSPKeyInput === 'LSP4Metadata') {
      return
    }
    // The key for the metadata URI in the main contract storage
    //use the key if it is passed in, otherwise use the default key
    // if it has a ": in we should hash it, otherwise if it's the length of a hash, we should use it as is" 0xb80bc58cb707abc7481424011c1ba223986b6b4302ab48ca53b85c77fb26ff12

    console.log('AssetService LSPKeyInput:', LSPKeyInput)

    //encode the key with erc725
    // const perkPropertyKeysKey = await LSP2Service.encodeKeyName({
    //   LSP2Schema: LSP2PerkSchema as ERC725JSONSchema[],
    //   keyName: LSPKeyInput,
    //   dynamicKeyParts: dynamicKeyParts,
    // })

    // Call _getData with the asset address
    console.log('AssetService LSPKeyInput _getdata: LSPKeyInput', LSPKeyInput)
    console.log(
      'AssetService dynamicKeyParts _getdata:  dynamicKeyParts',
      dynamicKeyParts,
    )
    if (!dynamicKeyParts) {
      dynamicKeyParts = []
    }
    const data = await LSP2Service._getData({
      contractAddress: assetAddress,
      key: LSPKeyInput,
      dynamicKeyParts,
      LSP2Schema: LSP2PerkSchema as ERC725JSONSchema[],
    })
    console.log('AssetService data value:', data)

    if (!data) {
      return undefined
    }
    return data
    // //destructure the different types that could be returned in to a data object so users can easily handle the return data instead of having to handle all the types that could be returned
    // if (typeof data === 'string') {
    //   //if the value is a string, return the string
    //   return data
    // }

    // if (data === null) {
    //   //if the value is null, return null
    //   return data
    // } else if (typeof value === 'object') {
    //   //if the value is an object, return the object
    //   return data
    // } else {
    //   throw new Error(
    //     'Error getting data, property unsupported by the AssetService (JSONURI) ',
    //   )
    // }
  }

  public async getLSP2Data(assetAddress: string): Promise<any> {
    throw new Error('Not implemented')
    // Call the _getData method on the asset contract for the keys we want to index
    // I want to map the keys to the EVENT_SIGNATURE.RefreshRequired event

    // Get all the perks for the asset, perhaps this should be in the perk service?
    const getAllPerks = async (assetAddress: string): Promise<any> => {
      // Let the supported keys be called for the asset
      // We can call the cover-all method getAllPerks() on the asset contract, we just need to pass in the Minted asset address.
      // THen decode the keys data to get the perks
      let params: callParams = {
        types: ['address'],
        values: [assetAddress],
      }
      let perks: any = undefined
      try {
        const erc725 = new ERC725(
          LSP2PerkSchema as ERC725JSONSchema[],
          assetAddress,
          CONSTANTS.RPC_URL,
        )

        // This is going to be a standard so we can't import the ABI
        const contractAbi = [
          {
            inputs: [
              {
                internalType: 'address',
                name: 'assetAddress',
                type: 'address',
              },
            ],
            name: 'getAllPerks',
            outputs: [
              {
                internalType: 'bytes32[]',
                name: '',
                type: 'bytes32[]',
              },
            ],
            stateMutability: 'pure',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'bytes32',
                name: 'dataKey',
                type: 'bytes32',
              },
            ],
            name: 'getData',
            outputs: [
              {
                internalType: 'bytes',
                name: 'dataValue',
                type: 'bytes',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
        ] as const

        // Get an instance to call getAllPerks with
        const contract = new EOAManagerService.web3.eth.Contract(
          contractAbi,
          assetAddress,
        )

        //encode the keys in the LSP2PerkSchema to use ERC725 to get the data easily
        let keys: string[] = []

        LSP2PerkSchema.forEach((perkSchemaJSON: any) => {
          // get the key from the perkSchemaItem
          perkSchemaJSON[1].name
          // encode to get the key with erc725
          erc725.encodeData(perkSchemaJSON[1].name, [
            assetAddress,
            perkSchemaJSON[1].name,
          ])
          keys.push()
        })

        // Call _getData with the asset address
        console.log('assetAddress:', assetAddress)

        if (!keys) {
          throw new Error('Error getting encoded perks')
        }

        let data: any = undefined
        keys.forEach(async (key: string) => {
          console.log('key:', key)
          const decodedData = await contract.methods.getData(key).call()
          console.log('decodedData:', decodedData)
          data = decodedData
        })

        // Get the encoded perks from the contract
        // // Get the perks
        // const txHash = await EOAManagerService._call({
        //   contractAddress: assetAddress,
        //   methodName: 'getAllPerks',
        //   params,
        // }) // returns the transaction hash of the call
        // Get the perks from the transaction receipt
        // const receipt: TransactionReceipt =
        //   await EOAManagerService.web3.eth.getTransactionReceipt(txHash)
        //   console.log('receipt:', receipt)
        // if (!receipt) {
        //   throw new Error('Error getting transaction receipt')
        // }
        // Get the encoded perks from the transaction receipt
        if (!keys) {
          throw new Error('Error getting encoded perks')
        }
        const encodedPerks = keys

        return encodedPerks
      } catch (error) {
        console.log('Error getting perks, skipping:', error)
      }
      return perks
    }

    return await getAllPerks(assetAddress)
  }

  // -- End of Helper functions for interfaces -- //

  // -- Start of Blockchain Sync -- //
  //    Helper functions
  private async _syncBlockchainLatestBlock(): Promise<void> {
    while (true) {
      // Get the latest block number from the blockchain
      try {
        const latestBlockNumber =
          await EOAManagerService.web3.eth.getBlockNumber()

        // Set the latest block number in the local state
        this.latestBlockNumber = EOAManagerService.web3.utils.toNumber(
          latestBlockNumber.toString(),
        )
        console.log('Latest block number:', this.latestBlockNumber)
        // Add a delay before the next scrape to save resources and prevent spamming the blockchain
      } catch (error) {
        console.error('Error getting latest block number:', error)
      }
      await new Promise(resolve => setTimeout(resolve, 6000)) // 6-second delay to not spam the node
    }
  }
  // -- End of Blockchain Sync -- //

  // -- Start of Scraper -- //
  //    Main function
  private async _startScraping(): Promise<void> {
    while (true) {
      try {
        if (this.lastBlockScraped < this.latestBlockNumber) {
          // Get the last block scraped + 1
          //  - Scrape the block data
          const blockData = await this._scrapeBlock(this.lastBlockScraped + 1)

          // Filter the blocks for the events that we support
          const filteredBlockData: { processedLogsQueue: IProcessedLogs[] } =
            await this._filterBlock(blockData, this.lastBlockScraped + 1)

          // if there is no new block data, return
          if (!filteredBlockData) {
            continue
          }

          let status = await this._processBlock({
            blockData: blockData,
            startBlockNumber: this.lastBlockScraped + 1,
            processedLogsQueue: filteredBlockData.processedLogsQueue,
          })
        }
      } catch (error) {
        console.error('Error scraping block:', error)
      }
      // Add a delay before the next scrape to save resources and prevent spamming the blockchain
      await new Promise(resolve => setTimeout(resolve, 0)) // 0 millisecond delay
    }
  }
  // Get a block from the blockchain
  private async _scrapeBlock(startBlock: number): Promise<any> {
    // Get the start block from the EOAManagers web3 instance
    const blockData = await EOAManagerService.web3.eth.getBlock(startBlock)
    return blockData
  }
  // Filter a blocks data for the events we want to process
  private async _filterBlock(
    blockData: any,
    startBlockNumber: any,
  ): Promise<{ processedLogsQueue: IProcessedLogs[] }> {
    // console.log(`Filtering Block: ${startBlockNumber}`, blockData)

    if (startBlockNumber % 100 === 0) {
      console.log(`Filtering Blocks: ${startBlockNumber}`)
    }
    const processedLogs: { processedLogsQueue: IProcessedLogs[] } =
      await AssetServiceUtil.filterForHandledEvents(blockData, startBlockNumber)
    if (processedLogs && processedLogs.processedLogsQueue === undefined) {
      // check if the array is empty
      console.log('response:', processedLogs)
    }
    await this._updateLastScrapedBlock(startBlockNumber)

    if (!processedLogs || !processedLogs.processedLogsQueue) {
      return
    }
    return { processedLogsQueue: processedLogs.processedLogsQueue }
  }

  // Process the blocks
  private async _processBlock({
    blockData,
    startBlockNumber,
    processedLogsQueue,
  }: {
    blockData: any
    startBlockNumber: any
    processedLogsQueue: IProcessedLogs[]
  }): Promise<{ error?: string } | void> {
    // Process the logs in the queue
    processedLogsQueue.forEach(
      // for each IProcessedLogs in the queue
      async (processedLog: IProcessedLogs): Promise<any> => {
        // Take the logs enclosed in the ProcessedLogs object and process them
        processedLog.logs.forEach(
          async (log: { eventData: any; transactionData: any }) => {
            // Destructure the logs enclosed in the ProcessedLogs object
            const { eventData, transactionData } = log

            // console.log('eventData:', eventData)

            const notify = (event: any) => {
              console.log(
                `Finished processing supported block (${startBlockNumber}), matched event:`,
                event,
              )
            }

            if (!eventData || !transactionData) {
              // Backoff exponentially if we don't have the data we need
              console.log('Error getting event data, backing off exponentially')

              throw new Error('Error getting event data, node is overloaded?')
            }
            const strategy = this.eventHandler.get(processedLog.eventSignature)
            if (strategy) {
              await strategy.handleEvent(
                processedLog,
                transactionData,
                eventData,
              )
            } else {
              console.log(
                'No strategy found for event signature:',
                processedLog.eventSignature,
              )
            }
            notify(processedLog.eventSignature)
          },
        )
      },
    )

    // Update the last scraped block
    await this._updateLastScrapedBlock(startBlockNumber)
    return
  }

  //processing:

  // // this._getMintedAssetAddresses()
  // Call the EOAManagerService to get the minted asset addresses from the main contracts storage
  // EOAManagerService._call(contractAddress: '',
  //     methodName: '',
  //     params: []
  // )

  // Get the asset metadata URI from the asset contracts
  // this._getAssetMetadataURI()

  // // Create the assets
  // this._createAssets()

  // Update the last scraped block
  private async _updateLastScrapedBlock(blockNumber: number): Promise<void> {
    // Update the last scraped block in the database and the local state
    this.lastBlockScraped = blockNumber
  }

  // -- End of scraper -- //

  // -- Public Functions -- //
  // Get a paginated list of assets
}

export default new AssetService()
