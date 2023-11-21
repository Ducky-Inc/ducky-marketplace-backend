export interface IpfsServiceType {
  uploadFile(filePath: string): Promise<string>
  uploadMetadata(metadata: string): Promise<string>
  retrieveFromIPFS(hash: string): Promise<any>
}
