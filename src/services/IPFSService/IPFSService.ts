import Web3, { Address, Contract } from 'web3'
import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import { CONSTANTS } from '../../constants/constants'

import IpfsService from './IPFSServiceModules/LocalIpfsModule'
import PinataService from './IPFSServiceModules/PinataIpfsModule'

import { IpfsServiceType } from './IPFSServiceModules/moduleInterface/IpfsServiceType'

class IPFSService {
  // Future implementation:
  // We want to have multiple upload services to prevent bottlenecks
  // private uploadServices: IpfsServiceType[] = []
  // we want to use exponential backoff globally for each service, so if one service fails we immediately try the next one, but add a delay to the first one
  // for now we will have the ipfs node as well as a pinata service
  private uploadServices: IpfsServiceType[] = [
    // new IpfsService(),
    new PinataService(),
  ]

  private state = {
    // State for the functions using the gateway
    FailuresSinceLastSuccess: 0,
    LastSuccess: 0,
    initialRateLimit: 60, // 60 seconds
    RateLimitState: 'Limited' as 'Ready' | 'Limited',
  }

  constructor() {}

  // Uploads a file to IPFS
  async uploadFile(filePath: string): Promise<string> {
    try {
      // TODO: Implement exponential backoff
      // for now just try each service until one works
      // pick a random service to start with
      const randomServiceIndex = Math.floor(
        Math.random() * this.uploadServices.length,
      )
      let serviceIndex = randomServiceIndex
      let hash: string = ''
      let service: IpfsServiceType
      while (!hash) {
        service = this.uploadServices[serviceIndex]
        try {
          hash = await service.uploadFile(filePath)
        } catch (error) {
          console.error('Error uploading file to IPFS:', error)
          // if we have tried all services, throw an error
          if (serviceIndex === this.uploadServices.length - 1) {
            throw new Error('Failed to upload file to IPFS')
          }
          // otherwise try the next service
          serviceIndex++
        }
      }
      return hash
    } catch (error) {
      console.error('Error uploading file to IPFS:', error)
      throw new Error('Failed to upload file to IPFS')
    }
  }

  // Uploads metadata to IPFS
  async uploadMetadata(metadata: string): Promise<string> {
    try {
      // TODO: Implement exponential backoff
      // for now just try each service until one works
      // pick a random service to start with

      const randomServiceIndex = Math.floor(
        Math.random() * this.uploadServices.length,
      )
      let serviceIndex = randomServiceIndex
      let hash: string = ''
      let service: IpfsServiceType
      while (!hash) {
        service = this.uploadServices[serviceIndex]
        try {
          hash = await service.uploadMetadata(metadata)
        } catch (error) {
          console.error('Error uploading metadata to IPFS:', error)
          // if we have tried all services, throw an error
          if (serviceIndex === this.uploadServices.length - 1) {
            throw new Error('Failed to upload metadata to IPFS')
          }
          // otherwise try the next service
          serviceIndex++
        }
      }

      return hash
    } catch (error) {
      console.error('Error uploading metadata to IPFS:', error)
      throw new Error('Failed to upload metadata to IPFS')
    }
  }

  // Retrieve data from IPFS
  async retrieveFromIPFS(hash: string): Promise<string | Buffer | null> {
    try {
      if (!hash) throw new Error('Hash not provided')
      if (this.state.RateLimitState === 'Limited') {
        // if we are rate limited, check if we can try again
        const timeSinceLastSuccess = Date.now() - this.state.LastSuccess
        if (
          timeSinceLastSuccess >=
          this.state.initialRateLimit *
            1000 *
            2 ** this.state.FailuresSinceLastSuccess
        ) {
          // if we can try again, reset the state
          this.state.RateLimitState = 'Ready'
          this.state.FailuresSinceLastSuccess = 0
        } else {
          // if we can't try again, throw an error
          throw new Error('Rate limited')
        }
      }

      let serviceIndex = 0
      let data: string | Buffer | null = null // Buffer for files, string for metadata

      // if the service fails, try the next one
      while (!data) {
        const service = this.uploadServices[serviceIndex]
        if (!service) throw new Error('No services available')
        console.log('Trying service:', service.constructor.name)

        try {
          data = await service.retrieveFromIPFS(hash)
          this.state.RateLimitState = 'Ready'
          this.state.FailuresSinceLastSuccess = 0
        } catch (error) {
          this.state.RateLimitState = 'Limited'
          this.state.FailuresSinceLastSuccess++ // increase the failures since last success
          console.log('Error retrieving data from IPFS:', error)
          // if we have tried all services, exponenetially backoff until we can try again

          if (serviceIndex < this.uploadServices.length - 1) {
            serviceIndex++ // try the next service
          } else {
            //reset the service index to 0
            serviceIndex = 0
          }

          // otherwise try the next service
        }
      }

      this.state.LastSuccess = Date.now()
      return data
    } catch (error) {
      console.log('Error retrieving data from IPFS:', error)
      throw new Error('Failed to retrieve data from IPFS')
    }
  }
}

export default new IPFSService()
