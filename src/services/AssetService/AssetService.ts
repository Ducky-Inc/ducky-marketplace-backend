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
import { DecodeDataInput } from '@erc725/erc725.js/build/main/src/types/decodeData'

// an interface that defines what an assets shape is
// This handles the business logic for the asset table, using the AssetTableService
class AssetService {
  private lastBlockScraped: number = 1444789 // we didn't start the standard until block 1430000
  private latestBlockNumber: any
  // We want to create an asset entry for each asset we want to display on the ducky marketplace
  // Scrape the blockchain for new assets, and create them if found
  // How will we determine what an asset is on the blockchain?
  // We will use the ERC721 standard, and look for the ERC721 events that are emitted when an asset is created

  constructor() {
    // Start a function that will keep the latest block number up to date
    this._startScraping()
    this._syncBlockchainLatestBlock()
    // Start the scraper function that will keep the database up to date
  }

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
        if (this.lastBlockScraped <= this.latestBlockNumber) {
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

          await this._processBlock({
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

    if (startBlockNumber % 10 === 0) {
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

  private async _getLSP2Data(assetAddress: string): Promise<any> {
    // Call the _getData method on the asset contract for the keys we want to index
    // I want to map the keys to the EVENT_SIGNATURE.RefreshRequired event

    // Get all the perks for the asset
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

  // Process the blocks
  private async _processBlock({
    blockData,
    startBlockNumber,
    processedLogsQueue,
  }: {
    blockData: any
    startBlockNumber: any
    processedLogsQueue: IProcessedLogs[]
  }): Promise<void> {
    // Process the logs in the queue
    processedLogsQueue.forEach(
      // for each IProcessedLogs in the queue
      async (processedLog: IProcessedLogs): Promise<any> => {
        // Take the logs enclosed in the ProcessedLogs object and process them
        processedLog.logs.forEach(
          async (log: { eventData: any; transactionData: any }) => {
            // Destructure the logs enclosed in the ProcessedLogs object
            const { eventData, transactionData } = log

            const notify = (event: any) => {
              console.log(
                `Handling supported block (${startBlockNumber}), matched event:`,
                event,
              )
            }

            if (!eventData || !transactionData) {
              throw new Error('Error getting event data')
            }

            switch (processedLog.eventSignature) {
              case EVENT_SIGNATURE.RefreshRequired: // Handle if it's a refreshRequired event
                //validate it matches our schema
                const valid = AssetServiceUtil.validateJSONData(
                  eventData.jsonData,
                  processedLog.eventSignature,
                )
                if (!valid) {
                  return
                }
                console.log('Found valid refreshRequired event JSON data')

                // console.log('eventData:', eventData)
                // change the strings of the eventData to array of action, assetAddress, and perkName, and key
                // Get the asset address that emitted the event
                const assetAddress = transactionData.to
                // Get the main contracts metadata URI from the main contracts storage if it exists
                const LSP2Key =
                  EOAManagerService.web3.utils.keccak256('LSP4Metadata')

                let params: callParams = {
                  types: ['bytes32'],
                  values: [LSP2Key],
                }
                let assetMetadataURI: string | undefined = undefined
                try {
                  assetMetadataURI = await EOAManagerService._call({
                    contractAddress: assetAddress,
                    methodName: '_getData',
                    params,
                  })
                } catch (error) {
                  console.log('Error getting metadata URI, skipping:', error)
                }

                // Try to fetch each of the keys that we support indexing
                const ReturnedLSP2Data = await this._getLSP2Data(assetAddress)
                console.log('ReturnedLSP2Data:', ReturnedLSP2Data)

                let metadata: any = {}
                //get the metadata from the URI
                if (assetMetadataURI) {
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
                    console.log('Error getting metadata from IPFS:', error)
                  }
                }
                const { description, image, external_url, name, attributes } =
                  metadata

                // console.log('metadata:', metadata)
                // Create the assets in the database, or update it if it already exists and has an older block number
                // Create the Perk Table entry for the Asset

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
                if (!createdAsset) {
                  throw new Error('Error creating asset')
                }
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
}

export default new AssetService()
