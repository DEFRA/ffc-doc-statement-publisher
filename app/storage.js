const { DefaultAzureCredential } = require('@azure/identity')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('./config').storageConfig
let blobServiceClient
let containersInitialised

if (config.useConnectionStr) {
  console.log('Using connection string for BlobServiceClient')
  blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionStr)
} else {
  console.log('Using DefaultAzureCredential for BlobServiceClient')
  const uri = `https://${config.storageAccount}.blob.core.windows.net`
  blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential())
}

const container = blobServiceClient.getContainerClient(config.container)

const initialiseContainers = async () => {
  if (config.createContainers) {
    console.log('Making sure blob containers exist')
    await container.createIfNotExists()
  }
  await initialiseFolders()
  containersInitialised = true
}

const initialiseFolders = async () => {
  const placeHolderText = 'Placeholder'
  const client = container.getBlockBlobClient(`${config.folder}/default.txt`)
  const reportClient = container.getBlockBlobClient(`${config.reportFolder}/default.txt`)
  await client.upload(placeHolderText, placeHolderText.length)
  await reportClient.upload(placeHolderText, placeHolderText.length)
}

const getBlob = async (filename) => {
  containersInitialised ?? await initialiseContainers()
  return container.getBlockBlobClient(`${config.folder}/${filename}`)
}

const getFile = async (filename) => {
  const blob = await getBlob(filename)
  return blob.downloadToBuffer()
}

const { PassThrough } = require('stream')

const saveReportFile = async (filename, readableStream) => {
  try {
    console.log('[STORAGE] Starting report file save:', filename)
    containersInitialised ?? await initialiseContainers()
    
    const client = container.getBlockBlobClient(`${config.reportFolder}/${filename}`)
    const options = {
      blobHTTPHeaders: {
        blobContentType: 'text/csv'
      }
    }

    return new Promise((resolve, reject) => {
      // Track if we received any data
      let hasData = false
      
      readableStream.on('data', (chunk) => {
        hasData = true
        console.log('[STORAGE] Received chunk:', chunk)//todo gets object not csv
        // console.log('[STORAGE] Received chunk:', chunk.toString().substring(0, 50))
      })

      readableStream.on('end', () => {
        console.log('[STORAGE] Stream ended, had data:', hasData)
      })

      readableStream.on('error', (err) => {
        console.error('[STORAGE] Stream error:', err)
        reject(err)
      })

      client.uploadStream(
        readableStream,
        4 * 1024 * 1024,  // 4MB chunks
        5,                 // 5 concurrent uploads
        options
      )
      .then(() => {
        console.log('[STORAGE] Upload completed')
        resolve()
      })
      .catch(reject)
    })
  } catch (error) {
    console.error('[STORAGE] Error saving report file:', error)
    throw error
  }
}

module.exports = { saveReportFile }

const getReportFile = async (filename) => {
  containersInitialised ?? await initialiseContainers()
  const client = container.getBlockBlobClient(`${config.reportFolder}/${filename}`)
  return client.downloadToBuffer()
}

module.exports = {
  initialiseContainers,
  getBlob,
  getFile,
  saveReportFile,
  getReportFile
}
