import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'

import { CONSTANTS } from '../../../constants/constants'

import { IpfsServiceType } from './moduleInterface/IpfsServiceType'

// This class uses both pinata gateway to get files and pinata api to upload files to ipfs
class IpfsService implements IpfsServiceType {
  private pinataApiKey = process.env.PINATA_API_KEY
  private GatewayUrl = 'https://gateway.pinata.cloud/ipfs/'
  public state: 'Ready' | 'Not Ready' = 'Not Ready'

  public gatewayComponent = {
    // State for the functions using the gateway
    FailuresSinceLastSuccess: 0,
    LastSuccess: 0,
    initialRateLimit: 60, // 60 seconds
    RateLimitState: 'Limited' as 'Ready' | 'Limited',
    // url: this.GatewayUrl,
  }

  constructor() {
    void this._init()
  }

  async _init() {
    try {
      if (!this.pinataApiKey) {
        throw new Error('Pinata API key is not set')
      }
      // try to fetch a file from ipfs to check if the service is ready
      const fetchedData = await this.retrieveFromIPFS(
        'QmeoT1HvHpDsdMEiQaTzuoueycdub9BcfA6UyPpAR9WtUz',
      )

      this.state = 'Ready'
      console.log('IpfsService is ready, using pinata gateway')
    } catch (error) {
      console.error('Initialization error:', error)
      throw new Error('Failed to initialize IpfsService')
    }
  }

  async uploadFile(data: string): Promise<string> {
    const formData = new FormData()
    const file = fs.createReadStream(data)

    formData.append('file', file)

    const pinataMetadata = JSON.stringify({
      name: 'File name',
    })
    formData.append('pinataMetadata', pinataMetadata)
    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    })
    formData.append('pinataOptions', pinataOptions)

    try {
      const JWT = this.pinataApiKey
      if (!JWT) {
        throw new Error('Pinata API key is not set')
      }
      const result = await axios.post(CONSTANTS.PINATA_API_URL, formData, {
        maxBodyLength: 'Infinity' as unknown as number,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
          Authorization: `Bearer ${JWT}`,
        },
      })
      if (!result.data.IpfsHash) {
        throw new Error('Failed to upload file to IPFS')
      }
      return result.data.IpfsHash
    } catch (error) {
      console.error('Error uploading file to IPFS:', error)
      throw new Error('Failed to upload file to IPFS')
    }
  }

  async uploadMetadata(data: string): Promise<string> {
    const formData = new FormData()

    try {
      const JWT = this.pinataApiKey
      if (!JWT) {
        throw new Error('Pinata API key is not set')
      }

      const jsonData = JSON.stringify(data)

      // Append the JSON data as a file to the form data
      // You can use Blob or similar approach if needed
      formData.append('file', jsonData, { filename: 'data.json' })

      const pinataMetadata = JSON.stringify({ name: 'File name' })
      formData.append('pinataMetadata', pinataMetadata)

      const pinataOptions = JSON.stringify({ cidVersion: 0 })
      formData.append('pinataOptions', pinataOptions)

      const result = await axios.post(CONSTANTS.PINATA_API_URL, formData, {
        maxBodyLength: 'Infinity' as unknown as number,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
          Authorization: `Bearer ${JWT}`,
        },
      })

      if (!result.data.IpfsHash) {
        throw new Error('Failed to upload file to IPFS')
      }
      return result.data.IpfsHash
    } catch (error) {
      console.error('Error uploading file to IPFS:', error)
      throw new Error('Failed to upload file to IPFS')
    }
  }

  //@Param hash: string - the hash (CID) of the file to retrieve
  // IPFS retrieval is rate limited, so we need to implement exponential backoff
  async retrieveFromIPFS(hash: string): Promise<any> {
    if (this.gatewayComponent.RateLimitState === 'Limited') {
      const canContinue = this.checkRateLimitHasPassed()
      if (!canContinue) {
        throw new Error('Failed to retrieve data from IPFS')
      }
    }

    if (!this.pinataApiKey) {
      throw new Error('Pinata API key is not set')
    }

    try {
      const response = await axios.get(
        `${this.GatewayUrl}${hash}?pinataGatewayToken=${this.pinataApiKey}`,
      )
      this.gatewayComponent.RateLimitState = 'Ready' // set the state to ready and reset the failure counter
      this.gatewayComponent.FailuresSinceLastSuccess = 0
      return response.data
    } catch (error) {
      console.log('Error retrieving data from IPFS:', error.message)
      console.log(error.response)
      if (error.response && error.response.status === 429) {
        // too many requests, try again after a delay
        // Increment the exponential backoff attempt counter
        this.gatewayComponent.RateLimitState = 'Limited'
        this.gatewayComponent.FailuresSinceLastSuccess++
      } else {
        throw new Error('Failed to retrieve data from IPFS')
      }
    }
  }

  checkRateLimitHasPassed = (): boolean => {
    const now = Date.now()
    const lastSuccess = this.gatewayComponent.LastSuccess
    const timeSinceLastSuccess = now - lastSuccess
    // Check if the rate limit has passed by checking the number of failures since the last success
    if (timeSinceLastSuccess > this.gatewayComponent.initialRateLimit * 1000) {
      // The rate limit has passed, so we can continue
      this.gatewayComponent.RateLimitState = 'Ready'
      return true
    }
  }
}

export default IpfsService
