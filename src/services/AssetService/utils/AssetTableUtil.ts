import Asset, { IAsset } from '../../../models/AssetModel/Asset.model'

// This is a class that defines actions that can be taken on the Asset table
class AssetTableUtil {
  constructor() {
    // Ensure the table exists
    Asset.sync()
  }
  // Create an asset
  public async createAsset(data: IAsset): Promise<Asset> {
    // Deconstruct the data object
    const {
      name,
      description,
      image,
      external_url,
      attributes,
      owner,
      metadataURI,
      address,
    } = data
    const [asset, created] = await Asset.upsert({
      address,
      metadataURI,
      owner,
      name,
      description,
      image,
      external_url,
      attributes,
    })
    if (!asset) {
      throw new Error('Error creating asset')
    }

    return asset
  }

  // Get a paginated list of assets
  public async getAssets(
    { offset, limit } = { offset: 0, limit: 10 },
  ): Promise<Asset[]> {
    const assets = await Asset.findAll({
      offset: offset * limit,
      limit: limit,
    })
    console.log('assets:', assets)
    if (!assets) {
      throw new Error('No assets found')
    }
    return assets
  }

  // Get a single asset by ID
  public async getAsset(id: number): Promise<Asset | null> {
    const asset = await Asset.findByPk(id)
    return asset
  }

  // Update an asset
  public async updateAsset(
    id: number,
    data: Partial<Asset[]>,
  ): Promise<[number, Asset[]]> {
    const [updateCount, updatedAssets] = await Asset.update(data, {
      where: { id: id },
      returning: true, // This is Postgres-specific and will return the updated object
    })
    return [updateCount, updatedAssets]
  }

  // Delete an asset
  public async deleteAsset(id: number): Promise<number> {
    const deleteCount = await Asset.destroy({
      where: { id: id },
    })
    return deleteCount
  }
}

export default new AssetTableUtil()
