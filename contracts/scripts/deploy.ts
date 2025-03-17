import { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with account:", deployer.address)

  // Deploy PlatformRewardPool
  const PlatformRewardPool = await ethers.getContractFactory("PlatformRewardPool")
  const rewardPool = await PlatformRewardPool.deploy()
  await rewardPool.deployed()
  console.log("PlatformRewardPool deployed to:", rewardPool.address)

  // Deploy UserExperiencePoints
  const UserExperiencePoints = await ethers.getContractFactory("UserExperiencePoints")
  const experience = await UserExperiencePoints.deploy()
  await experience.deployed()
  console.log("UserExperiencePoints deployed to:", experience.address)

  // Deploy NFTMarketplaceHub with rewardPool and experience addresses
  const NFTMarketplaceHub = await ethers.getContractFactory("NFTMarketplaceHub")
  const marketplace = await NFTMarketplaceHub.deploy(
    rewardPool.address,
    experience.address,
    "AIPenGuild",
    "AIPEN"
  )
  await marketplace.deployed()
  console.log("NFTMarketplaceHub deployed to:", marketplace.address)

  // Deploy NFTCreatorCollection with initial parameters and the marketplace address
  const NFTCreatorCollection = await ethers.getContractFactory("NFTCreatorCollection")
  const creatorCollection = await NFTCreatorCollection.deploy(
    "Default Collection",
    "This is a default NFT collection",
    ethers.utils.parseEther("0.1"),
    100,
    marketplace.address
  )
  await creatorCollection.deployed()
  console.log("NFTCreatorCollection deployed to:", creatorCollection.address)

  // Now set collection #0 in the marketplace
  console.log("Registering primary collection 0 with NFTMarketplaceHub...")
  const setCollectionTx = await marketplace.setNFTCollection(0, creatorCollection.address)
  await setCollectionTx.wait()
  console.log("Registered collection 0 ->", creatorCollection.address, " in NFTMarketplaceHub!")

  // Deploy NFTStakingPool
  const NFTStakingPool = await ethers.getContractFactory("NFTStakingPool")
  const stakingPool = await NFTStakingPool.deploy(
    marketplace.address,
    experience.address
  )
  await stakingPool.deployed()
  console.log("NFTStakingPool deployed to:", stakingPool.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })