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
  async retrieveFromIPFS(hash: string): Promise<any> {
    try {
      // TODO: Implement exponential backoff
      // for now just try each service until one works
      // pick a random service to start with
      const randomServiceIndex = Math.floor(
        Math.random() * this.uploadServices.length,
      )
      let serviceIndex = randomServiceIndex
      let data: any
      let service: IpfsServiceType
      while (!data) {
        service = this.uploadServices[serviceIndex]
        try {
          data = await service.retrieveFromIPFS(hash)
        } catch (error) {
          console.error('Error retrieving data from IPFS:', error)
          // if we have tried all services, throw an error
          if (serviceIndex === this.uploadServices.length - 1) {
            throw new Error('Failed to retrieve data from IPFS')
          }
          // otherwise try the next service
          serviceIndex++
        }
      }

      return data
    } catch (error) {
      console.error('Error retrieving data from IPFS:', error)
      throw new Error('Failed to retrieve data from IPFS')
    }
  }
}

export default new IPFSService()
