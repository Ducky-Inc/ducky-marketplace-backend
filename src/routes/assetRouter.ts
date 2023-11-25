import express from 'express'
import { getAssets } from '../controllers/assetController'

const router = express.Router()

router.get('/all', getAssets)

export default module.exports = router as express.Router
