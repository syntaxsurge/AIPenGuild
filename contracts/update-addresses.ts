import * as fs from "fs"
import * as path from "path"

async function updateAddresses() {
  try {
    const logPath = path.join(__dirname, "deploy.log")
    const addressesPath = path.join(__dirname, "addresses.ts")
    const logData = fs.readFileSync(logPath, "utf8")
    const lines = logData.split("\n")
    const addresses: { [key: string]: string } = {}

    for (const line of lines) {
      if (line.includes("RewardPool deployed to:")) {
        addresses.RewardPool = line.split("RewardPool deployed to:")[1].trim()
      }
      if (line.includes("UserExperience deployed to:")) {
        addresses.UserExperience = line.split("UserExperience deployed to:")[1].trim()
      }
      if (line.includes("NFTMarketplace deployed to:")) {
        addresses.NFTMarketplace = line.split("NFTMarketplace deployed to:")[1].trim()
      }
      if (line.includes("NFTCreatorCollection deployed to:")) {
        addresses.NFTCreatorCollection = line.split("NFTCreatorCollection deployed to:")[1].trim()
      }
    }

    let content = fs.readFileSync(addressesPath, "utf8")
    for (const [key, address] of Object.entries(addresses)) {
      const regex = new RegExp(`${key}: ".*?"`)
      content = content.replace(regex, `${key}: "${address}"`)
    }
    fs.writeFileSync(addressesPath, content)
    console.log("Addresses updated successfully.")
  } catch (error) {
    console.error("Error updating addresses:", error)
  }
}

updateAddresses()