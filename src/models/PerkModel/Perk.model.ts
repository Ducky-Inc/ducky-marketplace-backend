import { Model, DataTypes } from 'sequelize'
import sequelize from '../../connectors/Database/strategies/loadConstant'
import Asset from '../AssetModel/Asset.model'

export interface IPerk {
  id?: number
  perkName: string
  assetAddress: string
  perkMetadataURI: string
  perkKeys: string[]
  perkPropertyIDData: string[]
}

export class Perk extends Model {
  public id!: number
  public perkName!: string
  public assetAddress!: string
  public perkMetadataURI!: string
  public perkKeys!: string[]
  public perkPropertyIDData!: string[]

  // timestamps!
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Perk.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    perkName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    assetAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    perkMetadataURI: {
      type: DataTypes.STRING,
    },
    perkKeys: {
      type: DataTypes.JSON,
    },
    perkPropertyIDData: {
      type: DataTypes.JSON,
    },
  },
  {
    sequelize,
    modelName: 'Perk',
  },
)
Perk.belongsTo(Asset, {
  foreignKey: 'address',
  as: 'Perk',
})

export default Perk
