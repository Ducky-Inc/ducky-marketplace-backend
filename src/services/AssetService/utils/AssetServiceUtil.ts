import { getTransaction } from 'web3/lib/commonjs/eth.exports'
import EOAManagerService from '../../EOAManagerService/EOAManagerService'

import { EVENT_SIGNATURE } from '../constants'

interface IEventJsonInterface {
  name: string
  type: string
  inputs: any[]
}

export interface IProcessedLogs {
  txHash: string
  eventJsonInterface: IEventJsonInterface
  eventSignatureHash: string
  eventSignature: string
  logs: {
    eventData: {
      [key: string]: any
      __length__: number
      jsonData: string
    }
    transactionData: {
      [key: string]: any
      __length__: number
      blockHash: string
      blockNumber: string
      from: string
      gas: string
      gasPrice: string
      hash: string
      input: string
      nonce: string
      r: string
      s: string
      to: string
      transactionIndex: string
      v: string
      value: string
    }
  }[]
}

class AssetServiceUtil {
  constructor() {}

  // filter the blockchain for events we support and return them
  _processBloomFilter = async (
    txHash: string,
    blockData: any,
    startBlock: any,
    eventSignatureHash: any,
    eventJsonInterface: IEventJsonInterface,
  ): Promise<{ eventData: any; transactionData: any }[]> => {
    try {
      // calculate if the bloom filter is probable to contain the event signature hash
      // Returns true if the provided topic is part of this bloom filter
      // https://web3js.readthedocs.io/en/v1.2.11/web3-utils.html#istopic

      const isTopicInBloom = EOAManagerService.web3.utils.isTopicInBloom(
        blockData.logsBloom,
        eventSignatureHash,
      )
      if (!isTopicInBloom) {
        // console.log('Event or method signature hash not in bloom filter')
        return [] // Don't process this transaction, it doesn't have our handled events or methods
      }

      // Fetch the transaction receipt if the event signature hash is probable to be in the logs for the eventJsonInterface we are looking for
      const receipt =
        await EOAManagerService.web3.eth.getTransactionReceipt(txHash)

      const processedLogs = []
      for (const log of receipt.logs) {
        try {
          //decode the event data from the log
          const eventData = await EOAManagerService.web3.eth.abi.decodeLog(
            eventJsonInterface.inputs,
            log.data,
            log.topics,
          )

          if (!eventData) {
            console.log('No event data')
            processedLogs.push({ eventData: null, transactionData: null })
            continue // Skip to the next log
          }

          // Initialize transactionData as null

          const transactionData =
            await EOAManagerService.web3.eth.getTransaction(txHash)
          // if it exists, get the transacton data from the call that was sent to the contract

          if (!transactionData) {
            throw new Error('Error getting transaction data')
          }
          processedLogs.push({ eventData, transactionData })
        } catch (error) {
          console.log(error)
          // handle error so it doesn't stop the other transactions from being processed
          processedLogs.push({ eventData: null, transactionData: null })
        }
      }
      return processedLogs
    } catch (error) {
      console.error('Error in _processBloomFilter:', error)
      return []
    }
  }

  filterForHandledEvents = async (
    blockData: any,
    startBlock: any,
  ): Promise<{ processedLogsQueue: IProcessedLogs[] }> => {
    if (!blockData?.transactions) {
      // There are no transactions in this block, so no events to process
      return
    }

    // We will filter here to capture the relevant details (Assets for the marketplace, data refresh Events)

    // We will filter for the following examples:
    // 1. Asset creation events
    // 2. Asset update events
    // 3. Asset deletion events
    // 4. Data refresh events

    // We use this for the filter to check if the event signature hash is in the logs
    const eventSignatureMap = new Map()
    eventSignatureMap.set(
      EOAManagerService.web3.utils.sha3(EVENT_SIGNATURE.RefreshRequired),
      EVENT_SIGNATURE.RefreshRequired,
    )

    const eventSignatureHash = EOAManagerService.web3.utils.sha3(
      EVENT_SIGNATURE.RefreshRequired,
    )
    // console.log('eventSignatureHash', eventSignatureHash)

    // We use this to decode the event data from the logs if the event signature hash is in the logs
    const eventJsonInterface = {
      name: 'RefreshRequired',
      type: 'event',
      inputs: [
        {
          type: 'string',
          name: 'jsonData',
          indexed: false,
        },
      ],
    }

    // TODO: add these to an external config file or database or something
    // Generate the event signature hash to check for the event in the logs
    // We could have a database of the event signatures and eventSignatureHashes to save resources
    // This would act as a lookup table for the event signatures and hashes

    // Check each transaction in the block for the events and methods we support
    // For each transaction in the block, check the logs for the event signature hash

    // Prepare promises for processing each transaction
    const processedLogsPromises = blockData.transactions.map(
      async (txHash: string) =>
        this._processBloomFilter(
          txHash,
          blockData,
          startBlock,
          eventSignatureHash,
          eventJsonInterface,
        ),
    )

    // Resolve all promises concurrently using Promise.all
    const processedResults = await Promise.all(processedLogsPromises)

    // const eventSignature =
    //   eventSignatures.find(
    //     eventSignature =>
    //       EOAManagerService.web3.utils.sha3(eventSignature) ===
    //       eventSignatureHash,
    //   ) || '' // if it matched return the event signature, otherwise an empty string
    // // This is a hack, we should use a lookup table for the event signatures and hashes

    // Filter out any empty or null results and map to structured format
    const processedLogsQueue = processedResults
      .filter(result => result && result.length > 0)
      .map((processedLogs, index) => ({
        txHash: blockData.transactions[index],
        eventJsonInterface,
        eventSignatureHash: EOAManagerService.web3.utils.sha3(
          EVENT_SIGNATURE.RefreshRequired,
        ),
        eventSignature: eventSignatureMap.get(eventSignatureHash),
        logs: processedLogs,
      }))

    return { processedLogsQueue }
  }

  validateJSONData(jsonData: any, eventType: any): boolean {
    try {
      if (eventType === EVENT_SIGNATURE.RefreshRequired) {
        const jsonDataObject = JSON.parse(jsonData.trim())
        if (this.isRefreshRequiredType(jsonDataObject)) {
          return true
        }
      }
      return false
    } catch (error) {
      return false
    }
  }

  isRefreshRequiredType(object: any): boolean {
    if (!object || typeof object !== 'object') {
      return false
    }

    const requiredProperties = [
      { key: 'action', type: 'string' },
      { key: 'assetAddress', type: 'string' },
      { key: 'perkName', type: 'string' },
      { key: 'key', type: 'string' },
    ]

    for (const prop of requiredProperties) {
      if (!(prop.key in object) || typeof object[prop.key] !== prop.type) {
        return false
      }
    }

    return true
  }
}

export default new AssetServiceUtil()
