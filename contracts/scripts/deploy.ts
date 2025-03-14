import { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with account:", deployer.address)

  // Deploy AIRewardPool
  const AIRewardPool = await ethers.getContractFactory("AIRewardPool")
  const rewardPool = await AIRewardPool.deploy()
  await rewardPool.waitForDeployment()
  console.log("AIRewardPool deployed to:", rewardPool.target)

  // Deploy AIExperience
  const AIExperience = await ethers.getContractFactory("AIExperience")
  const experience = await AIExperience.deploy()
  await experience.waitForDeployment()
  console.log("AIExperience deployed to:", experience.target)

  // Deploy AINFTExchange with rewardPool and experience addresses
  const AINFTExchange = await ethers.getContractFactory("AINFTExchange")
  const exchange = await AINFTExchange.deploy(rewardPool.target, experience.target)
  await exchange.waitForDeployment()
  console.log("AINFTExchange deployed to:", exchange.target)

  // Deploy AICreatorCollection with initial parameters and the exchange address
  const AICreatorCollection = await ethers.getContractFactory("AICreatorCollection")
  const creatorCollection = await AICreatorCollection.deploy(
    "Default Collection",
    "This is a default NFT collection",
    ethers.parseEther("0.1"),
    100,
    exchange.target
  )
  await creatorCollection.waitForDeployment()
  console.log("AICreatorCollection deployed to:", creatorCollection.target)

  // Now set collection #0 in the exchange
  console.log("Registering primary collection 0 with AINFTExchange...")
  const setAiCollectionTx = await exchange.setAiCollection(0, creatorCollection.target)
  await setAiCollectionTx.wait()
  console.log("Registered collection 0 ->", creatorCollection.target, " in AINFTExchange!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })