import Web3, { TransactionReceipt } from 'web3'

import { CONSTANTS } from '../../constants/constants'

import { callParams } from '../../types/callParams'

// array of keys and values (ex) {[key1: value1], [key2: value2]} or {[key1: [value1, value2]]}

// * This service is responsible for managing the EOA (Externally Owned Accounts of the Ducky Marketplace)
// *  - Creating a new EOA
// *  - Signing messages with the EOA
// *  - Signing transactions with the EOA
// *  - Sending transactions with the EOA
// *  - Retrieving the EOA address
// *  - Retrieving the EOA balance
// *

class EOAManagerService {
  //we need web3 to interact with the blockchain
  private web3: Web3
  // we need the private key to sign transactions
  private privateKey: string
  // we need the address of the EOA to sign transactions
  private address: string
  private state: 'Ready' | 'Not Ready' = 'Not Ready'

  constructor() {
    void this._init()
  }

  private checkIfServiceIsReady() {
    if (this.state !== 'Ready') {
      throw new Error('Service not ready')
    }
  }

  private async _init() {
    try {
      this.web3 = new Web3(new Web3.providers.HttpProvider(CONSTANTS.RPC_URL))
      this.privateKey = process.env.PRIVATE_KEY
      if (!this.privateKey) {
        throw new Error('Private key is not set')
      }
      this.address = this.web3.eth.accounts.privateKeyToAccount(
        this.privateKey,
      ).address
      this.state = 'Ready'
      console.log('EOA Manager Service initialized with address:', this.address)
    } catch (error) {
      console.error('Initialization error:', error)
      throw new Error('Failed to initialize EOAManagerService')
    }
  }

  // Send a call to a contract with data and return the result
  async callContract(
    contractAddress: string,
    data: string,
    from?: string,
    gas?: number | string,
    gasPrice?: string,
  ): Promise<string> {
    this.checkIfServiceIsReady()
    try {
      const transaction = {
        from: from || this.address,
        to: contractAddress,
        data: data,
        gas: gas,
        gasPrice: gasPrice,
      }

      // Estimate gas if not provided
      if (typeof gas === 'undefined') {
        try {
          const estimatedGas = await this.web3.eth.estimateGas(transaction)
          transaction.gas = estimatedGas.toString()
        } catch (estimateError) {
          console.error('Error estimating gas:', estimateError)
          throw new Error('Failed to estimate gas')
        }
      } else {
        transaction.gas = typeof gas === 'string' ? gas : gas.toString()
      }

      // Get current gas price if not provided
      if (!gasPrice) {
        try {
          const currentGasPrice = await this.web3.eth.getGasPrice()
          transaction.gasPrice = currentGasPrice.toString()
        } catch (priceError) {
          console.error('Error getting current gas price:', priceError)
          throw new Error('Failed to get current gas price')
        }
      }
      console.log('test')

      // Sign the transaction
      const signedTx = await this.web3.eth.accounts.signTransaction(
        transaction,
        this.privateKey,
      )

      // Send the transaction
      const txHash = await this.web3.eth.sendSignedTransaction(
        signedTx.rawTransaction,
      )
      if (txHash) {
        return txHash.transactionHash.toString() // return the transaction hash, can be used to check the status of the transaction
      }
      throw new Error('Failed to send transaction')
    } catch (error) {
      console.error('Error sending transaction:', error)
      throw new Error('Failed to send transaction')
    }
  }

  // Use to check the status of a submitted transaction
  async waitForTransactionReceipt(
    txHash: string,
    timeout: number = 120000,
  ): Promise<TransactionReceipt | void> {
    try {
      this.checkIfServiceIsReady()
      return new Promise((resolve, reject) => {
        const startTime = Date.now()

        // Wait for the transaction to be mined
        const interval = setInterval(async () => {
          try {
            // Attempt to get the transaction receipt
            const receipt: TransactionReceipt =
              await this.web3.eth.getTransactionReceipt(txHash)
            if (receipt) {
              clearInterval(interval)
              resolve(receipt)
            } else if (Date.now() - startTime > timeout) {
              clearInterval(interval)
              reject(
                new Error(
                  'Transaction receipt not received within timeout period',
                ),
              )
            }
            // If the transaction receipt is not available yet, try again after 1 second
          } catch (error) {
            clearInterval(interval)
            console.error('Error getting transaction receipt:', error)
            reject(new Error('Failed to get transaction receipt')) // Use reject instead of throw
          }
        }, 1000)
      })
    } catch (error) {
      console.error('Error waiting for transaction receipt:', error)
      throw new Error('Failed to wait for transaction receipt')
    }
  }

  // Call a function
  async _call(
    contractAddress: string,
    methodName: string,
    params: callParams, // array of keys and values (ex) {[key1: value1], [key2: value2]} or {[key1: [value1, value2]]}
  ): Promise<string> {
    try {
      // Get the method signature
      const { types, values } = params

      const methodSignature = `${methodName}(${types.join(',')})`
      let methodId = this.web3.utils.sha3(methodSignature).substring(0, 10)

      //show the method name and types
      console.log('methodSignature', methodSignature)
      console.log('paramValues', values)

      //convert the values to a string
      // this will take an array of values and convert it to a string
      // Encode the parameters
      const encodedParameters = this.web3.eth.abi.encodeParameters(
        types,
        values,
      )

      const encodedCall = methodId + encodedParameters.substring(2)

      const result = await this.callContract(contractAddress, encodedCall)
      return result
    } catch (error) {
      console.error('Error calling contract:', error)
      throw new Error('Failed to call contract')
    }
  }
}

export default new EOAManagerService()

// // Sign a message with the EOA
// signMessage(message: string) {
//   return new Promise((resolve, reject) => {
//     this.web3.eth
//       .sign(message, this.address)
//       .then(signedMessage => {
//         resolve(signedMessage)
//       })
//       .catch(error => {
//         reject(error)
//       })
//   })
// }
