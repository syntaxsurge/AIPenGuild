import { transformIpfsUriToHttp } from "@/lib/ipfs"

/**
 * The shape of the metadata we return after parsing.
 */
export interface ParsedNftMetadata {
  imageUrl: string
  name: string
  description: string
  attributes: Record<string, any>
}

/**
 * Fetch and parse the NFT metadata JSON if resourceUrl is an IPFS or HTTP(S) link to metadata.json.
 * Otherwise, return fallback with the resourceUrl as the image.
 */
export async function fetchNftMetadata(resourceUrl: string): Promise<ParsedNftMetadata> {
  const fallback: ParsedNftMetadata = {
    imageUrl: transformIpfsUriToHttp(resourceUrl),
    name: "",
    description: "",
    attributes: {}
  }

  // If it's not ipfs:// or http(s)://, or doesn't look like metadata, just return fallback
  if (
    !resourceUrl.startsWith("ipfs://") &&
    !resourceUrl.startsWith("http://") &&
    !resourceUrl.startsWith("https://")
  ) {
    return fallback
  }

  try {
    // Convert to HTTP for fetch
    let metadataUrl = transformIpfsUriToHttp(resourceUrl)
    // Attempt to fetch JSON
    const resp = await fetch(metadataUrl)
    const data = await resp.json()

    if (data?.image) {
      const finalImageUrl = transformIpfsUriToHttp(data.image)
      return {
        imageUrl: finalImageUrl,
        name: data.name ?? "",
        description: data.description ?? "",
        attributes: data.attributes ?? {}
      }
    } else {
      // No 'image' key => treat the entire resourceUrl as fallback
      return fallback
    }
  } catch {
    // If fetch or parse fails, just return fallback
    return fallback
  }
}