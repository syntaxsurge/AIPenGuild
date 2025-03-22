import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with account:', deployer.address)

  // 1) Deploy PlatformRewardPool
  const PlatformRewardPool = await ethers.getContractFactory('PlatformRewardPool')
  const rewardPool = await PlatformRewardPool.deploy()
  await rewardPool.deployed()
  console.log('PlatformRewardPool deployed to:', rewardPool.address)

  // 2) Deploy UserExperiencePoints
  const UserExperiencePoints = await ethers.getContractFactory('UserExperiencePoints')
  const experience = await UserExperiencePoints.deploy()
  await experience.deployed()
  console.log('UserExperiencePoints deployed to:', experience.address)

  // 3) Deploy NFTMintingPlatform
  //    Constructor arguments: (address rewardPool, address experienceModule, string name, string symbol)
  const NFTMintingPlatform = await ethers.getContractFactory('NFTMintingPlatform')
  const nftMintingPlatform = await NFTMintingPlatform.deploy(
    rewardPool.address,
    experience.address,
    'AIPenGuild',
    'AIPEN'
  )
  await nftMintingPlatform.deployed()
  console.log('NFTMintingPlatform deployed to:', nftMintingPlatform.address)

  // 4) Deploy NFTMarketplaceHub
  //    Constructor: (address _rewardPool, address _experienceModule, address _nftMintingPlatform)
  const NFTMarketplaceHub = await ethers.getContractFactory('NFTMarketplaceHub')
  const marketplace = await NFTMarketplaceHub.deploy(rewardPool.address, experience.address, nftMintingPlatform.address)
  await marketplace.deployed()
  console.log('NFTMarketplaceHub deployed to:', marketplace.address)

  // 5) Deploy NFTCreatorCollection
  const NFTCreatorCollection = await ethers.getContractFactory('NFTCreatorCollection')
  const creatorCollection = await NFTCreatorCollection.deploy(
    'Default Collection',
    'This is a default NFT collection',
    ethers.utils.parseEther('0.1'),
    100,
    nftMintingPlatform.address, // minterPlatformAddress
    experience.address // xpModuleAddress
  )
  await creatorCollection.deployed()
  console.log('NFTCreatorCollection deployed to:', creatorCollection.address)

  // 6) Register primary collection (#0) in the NFTMintingPlatform
  console.log('Registering primary collection 0 with NFTMintingPlatform...')
  const setCollectionTx = await nftMintingPlatform.setNFTCollection(0, creatorCollection.address)
  await setCollectionTx.wait()
  console.log('Registered collection 0 ->', creatorCollection.address, 'in NFTMintingPlatform!')

  // 7) Deploy NFTStakingPool
  //    constructor(address _nftContract, address _experiencePoints)
  const NFTStakingPool = await ethers.getContractFactory('NFTStakingPool')
  const stakingPool = await NFTStakingPool.deploy(nftMintingPlatform.address, experience.address)
  await stakingPool.deployed()
  console.log('NFTStakingPool deployed to:', stakingPool.address)

  // 8) Authorize NFTStakingPool in UserExperiencePoints
  console.log('Authorizing NFTStakingPool in UserExperiencePoints as a caller...')
  let authTx = await experience.setAuthorizedCaller(stakingPool.address, true)
  await authTx.wait()
  console.log('Authorized NFTStakingPool to call stakeModifyUserXP!')

  // 9) Authorize NFTCreatorCollection in UserExperiencePoints
  //    to allow subtracting 100 XP when user pays with XP
  console.log('Authorizing NFTCreatorCollection in UserExperiencePoints as a caller...')
  authTx = await experience.setAuthorizedCaller(creatorCollection.address, true)
  await authTx.wait()
  console.log('Authorized NFTCreatorCollection to subtract XP from users when they pay with XP!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
