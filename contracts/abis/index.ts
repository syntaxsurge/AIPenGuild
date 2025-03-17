import NFTMarketplaceHubArtifact from "../artifacts/solidity/NFTMarketplaceHub.sol/NFTMarketplaceHub.json"
import PlatformRewardPoolArtifact from "../artifacts/solidity/PlatformRewardPool.sol/PlatformRewardPool.json"
import UserExperiencePointsArtifact from "../artifacts/solidity/UserExperiencePoints.sol/UserExperiencePoints.json"
import NFTCreatorCollectionArtifact from "../artifacts/solidity/NFTCreatorCollection.sol/NFTCreatorCollection.json"
import NFTStakingPoolArtifact from "../artifacts/solidity/NFTStakingPool.sol/NFTStakingPool.json"

// Use .abi to ensure we pass an array-based ABI
export const ABIS = {
  NFTMarketplaceHub: NFTMarketplaceHubArtifact.abi,
  PlatformRewardPool: PlatformRewardPoolArtifact.abi,
  UserExperiencePoints: UserExperiencePointsArtifact.abi,
  NFTCreatorCollection: NFTCreatorCollectionArtifact.abi,
  NFTStakingPool: NFTStakingPoolArtifact.abi,
}