import NFTCreatorCollectionArtifact from "../artifacts/solidity/NFTCreatorCollection.sol/NFTCreatorCollection.json"
import NFTMarketplaceHubArtifact from "../artifacts/solidity/NFTMarketplaceHub.sol/NFTMarketplaceHub.json"
import NFTStakingPoolArtifact from "../artifacts/solidity/NFTStakingPool.sol/NFTStakingPool.json"
import PlatformRewardPoolArtifact from "../artifacts/solidity/PlatformRewardPool.sol/PlatformRewardPool.json"
import UserExperiencePointsArtifact from "../artifacts/solidity/UserExperiencePoints.sol/UserExperiencePoints.json"

// Use .abi to ensure we pass an array-based ABI
export const ABIS = {
  NFTCreatorCollection: NFTCreatorCollectionArtifact.abi,
  NFTMarketplaceHub: NFTMarketplaceHubArtifact.abi,
  NFTStakingPool: NFTStakingPoolArtifact.abi,
  PlatformRewardPool: PlatformRewardPoolArtifact.abi,
  UserExperiencePoints: UserExperiencePointsArtifact.abi,
}