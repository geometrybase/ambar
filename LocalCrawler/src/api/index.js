import { version, name, description } from '../../package.json'
import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import config from '../config'
import contentDisposition from 'content-disposition'


import * as ApiProxy from '../services/ApiProxy'

export default () => {
	let api = Router()

	api.get('/', (req, res) => {
		res.json({
			name: name,
			version: version,
			description: description
		})
	})

	api.get('/download', (req, res) => {
		const filePath = req.query.path

		if (!filePath) {
			res.sendStatus(400)
			return
		}

		let absolutePath = null
		let doesFileExist = false

		try {
			absolutePath = path.join(config.crawlPath, filePath)
			doesFileExist = fs.existsSync(absolutePath)
		} catch (error) {
			ApiProxy.logData(config.name, 'error', `Error: ${error}`)
			res.status(500).json({ error: error })
			return
		}

		if (!doesFileExist) {
			res.sendStatus(404)
			return
		}
        if(absolutePath.slice(absolutePath.length-4)==='pdf'){
          let stat = fs.statSync(absolutePath);
          res.setHeader('Content-disposition', contentDisposition(absolutePath, {type:'inline'}));
          res.setHeader('Content-Length', stat.size);
          res.setHeader('Content-Type', 'application/pdf');
        }else{
          let stat = fs.statSync(absolutePath);
          res.setHeader('Content-disposition', contentDisposition(absolutePath));
          res.setHeader('Content-Length', stat.size);
        }
		res.sendFile(absolutePath, (error) => {
			if (error) {
				if (!res.headersSent) {
					res.status(500).json({ error: error })
				}
				ApiProxy.logData(config.name, 'error', `[${absolutePath}] Error: ${error}`)
			}
		})
	})

	return api
}
