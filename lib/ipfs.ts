/**
 * Transform an ipfs:// URI to an HTTP gateway URL (e.g., https://ipfs.io/ipfs/...).
 * If it's not ipfs://, return it unchanged.
 */
export function transformIpfsUriToHttp(ipfsUrl: string): string {
  if (!ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl
  }
  // Replace ipfs:// with https://ipfs.io/ipfs/
  return ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
}

/**
 * Upload a file to IPFS via Unique Network's public endpoint, returning a direct URL.
 * Adjust the endpoint for your own service if needed.
 */
export async function uploadFileToIpfs(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('files', file)

  const res = await fetch('https://rest.unique.network/opal/v1/ipfs/upload-files', {
    method: 'POST',
    body: formData
  })
  if (!res.ok) {
    throw new Error('Failed to upload file to IPFS')
  }

  const data = await res.json()
  // data.fullUrl => "https://ipfs.unique.network/ipfs/<CID>/"
  // We typically want the direct file link:
  const directFileUrl = data.fullUrl.endsWith('/') ? data.fullUrl + file.name : data.fullUrl + '/' + file.name

  return directFileUrl
}

/**
 * Upload JSON data to IPFS, returning the direct URL to 'metadata.json'.
 */
export async function uploadJsonToIpfs(jsonData: any): Promise<string> {
  const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' })
  const file = new File([blob], 'metadata.json', { type: 'application/json' })

  const formData = new FormData()
  formData.append('files', file)

  const res = await fetch('https://rest.unique.network/opal/v1/ipfs/upload-files', {
    method: 'POST',
    body: formData
  })
  if (!res.ok) {
    throw new Error('Failed to upload JSON to IPFS')
  }

  const data = await res.json()
  // data.fullUrl might be "https://ipfs.unique.network/ipfs/<CID>/"
  const directMetadataUrl = data.fullUrl.endsWith('/')
    ? data.fullUrl + 'metadata.json'
    : data.fullUrl + '/metadata.json'

  return directMetadataUrl
}
