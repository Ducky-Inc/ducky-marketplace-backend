import express, { Express, Request, Response, Application } from 'express'
import 'dotenv/config'
require('dotenv').config()

// Services
import AssetService from './src/services/AssetService/AssetService'

// Routers
import assetPerkRouter from './src/routes/assetPerkRouter'
import assetRouter from './src/routes/assetRouter'

const app: Application = express()
const port = process.env.PORT || 8001

// Loading Singleton Services
const assetService = AssetService

// Routes
app.use('/asset/perk', assetPerkRouter) // (in progress, mocked request) addition of perks to assets, and (TODO) redemption of perks
app.use('/asset', assetRouter) // returns all assets from the database

// Start the server
app.listen(port, () => {
  console.log(`Server is live at http://localhost:${port}`)
})
