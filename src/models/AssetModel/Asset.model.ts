import { Model, DataTypes } from 'sequelize'
import sequelize from '../../connectors/Database/strategies/loadConstant'
import Perk from '../PerkModel/Perk.model'

export interface IAsset {
  address: string
  metadataURI: string | undefined
  owner: string | undefined
  name: string | undefined
  description: string | undefined
  image: string | undefined
  external_url: string | undefined
  attributes: string | undefined
}

// Define the model
export class Asset extends Model {
  public address!: number // Note that the `null assertion` `!` is required in strict mode.
  public metadataURI: string
  public owner: string
  public name: string | undefined
  public description: string
  public image: string
  public external_url: string
  public attributes: string

  // timestamps!
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Asset.init(
  {
    address: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    metadataURI: {
      type: DataTypes.STRING,
      // allowNull defaults to true
    },
    owner: {
      type: DataTypes.STRING,
      // allowNull defaults to true
    },
    // Model attributes are defined here
    name: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
      // allowNull defaults to true
    },
    image: {
      type: DataTypes.STRING,
      // allowNull defaults to true
    },
    external_url: {
      type: DataTypes.STRING,
      // allowNull defaults to true
    },
    attributes: {
      type: DataTypes.JSON, // Using JSON type for PostgreSQL
    },
  },
  {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'Asset', // We need to choose the model name
  },
)

// Asset.hasMany(Perk, {
//   foreignKey: 'assetAddress',
//   as: 'perks',
// })

export default Asset
