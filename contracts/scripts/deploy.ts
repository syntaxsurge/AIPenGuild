import { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with account:", deployer.address)

  // Deploy RewardPool
  const RewardPool = await ethers.getContractFactory("RewardPool")
  const rewardPool = await RewardPool.deploy()
  await rewardPool.waitForDeployment()
  console.log("RewardPool deployed to:", rewardPool.target)

  // Deploy UserExperience
  const UserExperience = await ethers.getContractFactory("UserExperience")
  const experience = await UserExperience.deploy()
  await experience.waitForDeployment()
  console.log("UserExperience deployed to:", experience.target)

  // Deploy NFTMarketplace with rewardPool and experience addresses
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace")
  const marketplace = await NFTMarketplace.deploy(
    rewardPool.target,
    experience.target,
    "AIPenGuild",
    "AIPEN"
  )
  await marketplace.waitForDeployment()
  console.log("NFTMarketplace deployed to:", marketplace.target)

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
  console.log("Registering primary collection 0 with NFTMarketplace...")
  const setCollectionTx = await marketplace.setNFTCollection(0, creatorCollection.target)
  await setCollectionTx.wait()
  console.log("Registered collection 0 ->", creatorCollection.target, " in NFTMarketplace!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })