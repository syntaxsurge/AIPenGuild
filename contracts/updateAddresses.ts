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
      if (line.includes("AIRewardPool deployed to:")) {
        addresses.AIRewardPool = line.split("AIRewardPool deployed to:")[1].trim()
      }
      if (line.includes("AIExperience deployed to:")) {
        addresses.AIExperience = line.split("AIExperience deployed to:")[1].trim()
      }
      if (line.includes("AINFTExchange deployed to:")) {
        addresses.AINFTExchange = line.split("AINFTExchange deployed to:")[1].trim()
      }
      if (line.includes("AICreatorCollection deployed to:")) {
        addresses.CreatorCollection = line.split("AICreatorCollection deployed to:")[1].trim()
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
