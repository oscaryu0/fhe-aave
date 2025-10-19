import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedToken = await deploy("fheUSDT", {
    from: deployer,
    log: true,
  });

  const deployedLendingPool = await deploy("FHELendingPool", {
    from: deployer,
    args: [deployedToken.address],
    log: true,
  });

  console.log(`fheUSDT contract: ${deployedToken.address}`);
  console.log(`FHELendingPool contract: ${deployedLendingPool.address}`);
};
export default func;
func.id = "deploy_lending"; // id required to prevent reexecution
func.tags = ["Lending"];
