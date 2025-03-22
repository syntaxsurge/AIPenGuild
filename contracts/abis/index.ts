import NFTCreatorCollectionArtifact from '../artifacts/solidity/NFTCreatorCollection.sol/NFTCreatorCollection.json'
import NFTMarketplaceHubArtifact from '../artifacts/solidity/NFTMarketplaceHub.sol/NFTMarketplaceHub.json'
import NFTMintingPlatformArtifact from '../artifacts/solidity/NFTMintingPlatform.sol/NFTMintingPlatform.json'
import NFTStakingPoolArtifact from '../artifacts/solidity/NFTStakingPool.sol/NFTStakingPool.json'
import PlatformRewardPoolArtifact from '../artifacts/solidity/PlatformRewardPool.sol/PlatformRewardPool.json'
import UserExperiencePointsArtifact from '../artifacts/solidity/UserExperiencePoints.sol/UserExperiencePoints.json'

// Use .abi from the compiled artifacts
export const ABIS = {
  NFTCreatorCollection: NFTCreatorCollectionArtifact.abi,
  NFTMarketplaceHub: NFTMarketplaceHubArtifact.abi,
  NFTMintingPlatform: NFTMintingPlatformArtifact.abi,
  NFTStakingPool: NFTStakingPoolArtifact.abi,
  PlatformRewardPool: PlatformRewardPoolArtifact.abi,
  UserExperiencePoints: UserExperiencePointsArtifact.abi
}
