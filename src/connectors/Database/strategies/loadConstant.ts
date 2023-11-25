import { Sequelize, DataTypes } from 'sequelize'
import { CONSTANTS } from '../../../constants/constants'

const sequelize = new Sequelize(CONSTANTS.DB_CONNECTOR)

export default sequelize
