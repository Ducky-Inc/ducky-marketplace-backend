import { Request, Response } from 'express'
import AssetService from '../services/AssetService/utils/AssetTableUtil'

// Get indexed assets
// @ Public - get: /api/asset
export const getAssets = async (req: Request, res: Response) => {
  try {
    // extract the query params
    const { page, limit } = req.query as { page: string; limit: string }
    // get the requested assets and return them as a response to the client
    const pageInt = parseInt(page)
    const limitInt = parseInt(limit)

    if (pageInt < 0 || limitInt < 0) {
      throw new Error('Invalid page or limit')
    }

    const result = await AssetService.getAssets({
      offset: pageInt | 0,
      limit: limitInt | 10,
    })
    if (result) {
      res.status(200).json(result)
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    res.status(500).json({ error: errorMessage })
  }
}
