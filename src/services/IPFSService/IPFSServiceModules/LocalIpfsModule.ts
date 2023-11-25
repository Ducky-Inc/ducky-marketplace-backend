import axios from 'axios'
import fs from 'fs'

import { CONSTANTS } from '../../../constants/constants'

import { IpfsServiceType } from './moduleInterface/IpfsServiceType'

class IpfsService implements IpfsServiceType {
  private disabled =
    process.env.DISABLE_LOCAL_IPFS === 'true'
      ? true
      : CONSTANTS.DISABLE_LOCAL_IPFS
  async uploadFile(filePath: string): Promise<string> {
    if (this.disabled) {
      throw new Error('Local IPFS is disabled')
    }
    return // commented out until I come back to this
    // const formData = new FormData()
    // formData.append('file', fs.createReadStream(filePath))

    // try {
    //   const response = await axios.post(
    //     `${CONSTANTS.IPFS_NODE_URL}/api/v0/add`,
    //     formData,
    //     {
    //       headers: formData.getHeaders(),
    //     },
    //   )

    //   return response.data.Hash
    // } catch (error) {
    //   console.error('Error uploading file to IPFS:', error)
    //   throw new Error('Failed to upload file to IPFS')
    // }
  }

  async uploadMetadata(metadata: object): Promise<string> {
    if (this.disabled) {
      throw new Error('Local IPFS is disabled')
    }
    try {
      const response = await axios.post(
        `${CONSTANTS.IPFS_NODE_URL}/api/v0/add`,
        JSON.stringify(metadata),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      return response.data.Hash
    } catch (error) {
      console.error('Error uploading metadata to IPFS:', error)
      throw new Error('Failed to upload metadata to IPFS')
    }
  }

  async retrieveFromIPFS(hash: string): Promise<any> {
    if (this.disabled) {
      throw new Error('Local IPFS is disabled')
    }
    try {
      const response = await axios.get(
        `${CONSTANTS.IPFS_NODE_URL}/api/v0/cat?arg=${hash}`,
      )
      return response.data
    } catch (error) {
      console.log('Error retrieving data from IPFS:', error)
      throw new Error('Failed to retrieve data from IPFS')
    }
  }
}

export default IpfsService
