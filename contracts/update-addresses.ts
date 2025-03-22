import * as fs from 'fs'
import * as path from 'path'

async function updateAddresses() {
  try {
    const logPath = path.join(__dirname, 'deploy.log')
    const addressesPath = path.join(__dirname, 'addresses.ts')
    const logData = fs.readFileSync(logPath, 'utf8')
    const lines = logData.split('\n')
    const addresses: { [key: string]: string } = {}

    for (const line of lines) {
      if (line.includes('PlatformRewardPool deployed to:')) {
        addresses.PlatformRewardPool = line.split('PlatformRewardPool deployed to:')[1].trim()
      }
      if (line.includes('UserExperiencePoints deployed to:')) {
        addresses.UserExperiencePoints = line.split('UserExperiencePoints deployed to:')[1].trim()
      }
      if (line.includes('NFTMintingPlatform deployed to:')) {
        addresses.NFTMintingPlatform = line.split('NFTMintingPlatform deployed to:')[1].trim()
      }
      if (line.includes('NFTMarketplaceHub deployed to:')) {
        addresses.NFTMarketplaceHub = line.split('NFTMarketplaceHub deployed to:')[1].trim()
      }
      if (line.includes('NFTCreatorCollection deployed to:')) {
        addresses.NFTCreatorCollection = line.split('NFTCreatorCollection deployed to:')[1].trim()
      }
      if (line.includes('NFTStakingPool deployed to:')) {
        addresses.NFTStakingPool = line.split('NFTStakingPool deployed to:')[1].trim()
      }
    }

    let content = fs.readFileSync(addressesPath, 'utf8')

    for (const [key, address] of Object.entries(addresses)) {
      const regex = new RegExp(`${key}:\\s*"[^"]+"`)
      content = content.replace(regex, `${key}: "${address}"`)
    }

    fs.writeFileSync(addressesPath, content)
    console.log('Addresses updated successfully.')
  } catch (error) {
    console.error('Error updating addresses:', error)
  }
}

updateAddresses()
