import express, { Express, Request, Response, Application } from 'express'
import 'dotenv/config'
require('dotenv').config()

import assetPerkRouter from './src/routes/assetPerkRouter'

const app: Application = express()
const port = process.env.PORT || 8001

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Express & TypeScript Server')
})

app.use('/asset/perk', assetPerkRouter)

app.listen(port, () => {
  console.log(`Server is live at http://localhost:${port}`)
})
