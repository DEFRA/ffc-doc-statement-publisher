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
  blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential({ managedIdentityClientId: config.managedIdentityClientId }))
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
  await client.upload(placeHolderText, placeHolderText.length)
}

const getOutboundBlobClient = async (filename) => {
  containersInitialised ?? await initialiseContainers()
  return container.getBlockBlobClient(`${config.folder}/${filename}`)
}

const getFile = async (filename) => {
  const blob = await getOutboundBlobClient(filename)
  return blob.downloadToBuffer()
}

module.exports = {
  initialiseContainers,
  blobServiceClient,
  getOutboundBlobClient,
  getFile
}
