import { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with account:", deployer.address)

  // Deploy PlatformRewardPool
  const PlatformRewardPool = await ethers.getContractFactory("PlatformRewardPool")
  const rewardPool = await PlatformRewardPool.deploy()
  await rewardPool.waitForDeployment()
  console.log("PlatformRewardPool deployed to:", rewardPool.target)

  // Deploy UserExperiencePoints
  const UserExperiencePoints = await ethers.getContractFactory("UserExperiencePoints")
  const experience = await UserExperiencePoints.deploy()
  await experience.waitForDeployment()
  console.log("UserExperiencePoints deployed to:", experience.target)

  // Deploy NFTMarketplaceHub with rewardPool and experience addresses
  const NFTMarketplaceHub = await ethers.getContractFactory("NFTMarketplaceHub")
  const marketplace = await NFTMarketplaceHub.deploy(
    rewardPool.target,
    experience.target,
    "AIPenGuild",
    "AIPEN"
  )
  await marketplace.waitForDeployment()
  console.log("NFTMarketplaceHub deployed to:", marketplace.target)

  // Deploy NFTCreatorCollection with initial parameters and the marketplace address
  const NFTCreatorCollection = await ethers.getContractFactory("NFTCreatorCollection")
  const creatorCollection = await NFTCreatorCollection.deploy(
    "Default Collection",
    "This is a default NFT collection",
    ethers.parseEther("0.1"),
    100,
    marketplace.target
  )
  await creatorCollection.waitForDeployment()
  console.log("NFTCreatorCollection deployed to:", creatorCollection.target)

  // Now set collection #0 in the marketplace
  console.log("Registering primary collection 0 with NFTMarketplaceHub...")
  const setCollectionTx = await marketplace.setNFTCollection(0, creatorCollection.target)
  await setCollectionTx.wait()
  console.log("Registered collection 0 ->", creatorCollection.target, " in NFTMarketplaceHub!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })