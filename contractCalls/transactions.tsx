import { ethers } from "ethers";
import erc20Abi from "../constants/abis/ERC20.json"
import { getTokenDetails } from "../utils";

export const depositNew = async (contracts, signer, position, asset) => {
  const account = await signer.getAddress()
  if (asset.contract_address!=ethers.constants.AddressZero) {
    const contract = new ethers.Contract(asset.contract_address, erc20Abi, signer)
    const currentApproval = await contract.allowance(account, contracts.positionManager.address)
    if (currentApproval<position.amount) {
      await contract.approve(contracts.positionManager.address, position.amount)
    }
    await contracts.positionManager["deposit((address,uint256,uint256,uint256,(address,address,bool,uint256)[]),address[],uint256[])"]
    (position, [asset.contract_address], [position.amount])
  } else {
    await contracts.positionManager["deposit((address,uint256,uint256,uint256,(address,address,bool,uint256)[]),address[],uint256[])"]
    (position, [], [], {value: position.amount})
  }
}

export const swap = async (contracts, signer, assetsToConvert, wantedAssets) => {
  const account = await signer.getAddress()
  const inputTokens = []
  const inputTokenAmounts = []
  const outputTokens = []
  const outputRatios = []
  const minAmountsOut = []
  let ethSupplied = ethers.BigNumber.from('0')
  for (const asset of assetsToConvert) {
    if (asset.contract_address!=ethers.constants.AddressZero) {
      const assetContract = new ethers.Contract(asset.contract_address, erc20Abi, signer)
      const tokensSupplied = ethers.utils.parseUnits(asset.tokensSupplied, asset.contract_decimals)
      const currentAllowance = await assetContract.allowance(account, contracts.universalSwap.address)
      if (currentAllowance<tokensSupplied) {
        await assetContract.approve(contracts.universalSwap.address, tokensSupplied)
      }
      inputTokens.push(asset.contract_address)
      inputTokenAmounts.push(tokensSupplied)
    } else {
      ethSupplied = ethers.utils.parseUnits(asset.tokensSupplied, asset.contract_decimals)
    }
  }
  for (const asset of wantedAssets) {
    outputTokens.push(asset.contract_address)
    minAmountsOut.push(ethers.utils.parseUnits(asset.minOut.toFixed(asset.contract_decimals), asset.contract_decimals))
    outputRatios.push(asset.percentage*10000)
  }
  await contracts.universalSwap.swap(inputTokens, inputTokenAmounts, outputTokens, outputRatios, minAmountsOut, {value:ethSupplied})
}

export const depositAgain = async (contracts, signer, position, assetsToConvert, chainId, slippage) => {
  const account = await signer.getAddress()
  const usdTotal = assetsToConvert.reduce((a, b)=>a+b.usdcValue, 0)
  const bankId = position.positionData.bankId.toNumber()
  const bankContract = contracts.banks[bankId]
  const underlyingTokens = await bankContract.callStatic.getUnderlyingForRecurringDeposit(position.positionData.bankToken)
  const minAmounts = []
  for (const token of underlyingTokens[0]) {
    const {data:{price, decimals}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${token}`)).json()
    const usd = usdTotal/underlyingTokens.length
    const expectedTokens = usd/price
    const allowedSlippage = expectedTokens*(1-slippage/100)
    const minAmount = ethers.utils.parseUnits(allowedSlippage.toFixed(decimals).toString(), decimals)
    minAmounts.push(minAmount)
  }
  const addresses = []
  let ethSupplied = ethers.BigNumber.from('0')
  const amounts = []
  for (const [index, asset] of assetsToConvert.entries()) {
    const address = asset.contract_address
    if (address!=ethers.constants.AddressZero) {
      addresses.push(address)
      amounts.push(ethers.utils.parseUnits(asset.tokensSupplied.toString(), asset.tokenDecimals))
      const contract = new ethers.Contract(address, erc20Abi,signer)
      const allowance = await contract.allowance(account, contracts.positionManager.address)
      if (allowance.toString()<amounts[index].toString()){
        await contract.approve(contracts.positionManager.address, amounts[index])
      }
    } else {
      ethSupplied = ethers.utils.parseUnits(asset.tokensSupplied.toString(), asset.tokenDecimals)
    }
  }
  await contracts.positionManager["deposit(uint256,address[],uint256[],uint256[])"](position.positionId, addresses, amounts, minAmounts, {value: ethSupplied})
}

export const adjustLiquidationPoints = async (contracts, positionId, liquidationConditions) => {
  await contracts.positionManager.adjustLiquidationPoints(positionId, liquidationConditions)
}

export const harvest = async (contracts, positionId) => {
  await contracts.positionManager.harvestRewards(positionId)
}

export const compound = async (contracts, positionId, slippage, chainId) => {
  const {rewards, rewardAmounts} = await contracts.positionManager.callStatic.harvestRewards(positionId)
  const usdValues = []
  for (const [index, reward] of rewards.entries()) {
    const tokenData = await getTokenDetails(chainId, reward)
    const amount = +ethers.utils.formatUnits(rewardAmounts[index].toString(), tokenData.decimals)
    const usdValue = amount*tokenData.price
    usdValues.push(usdValue)
  }

  const position = await contracts.positionManager.getPosition(positionId)
  const usdSupplied = usdValues.reduce((a, b)=>a+b, 0)
  const bankId = position.bankId.toNumber()
  const bankContract = contracts.banks[bankId]
  const underlyingTokens = await bankContract.callStatic.getUnderlyingForRecurringDeposit(position.bankToken)
  const minAmounts = []
  for (const token of underlyingTokens[0]) {
    const {data:{price, decimals}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${token}`)).json()
    const usd = usdSupplied/underlyingTokens.length
    const expectedTokens = usd/price
    const allowedSlippage = expectedTokens*(1-slippage/100)
    const minAmount = ethers.utils.parseUnits(allowedSlippage.toFixed(decimals).toString(), decimals)
    minAmounts.push(minAmount)
  }
  await contracts.positionManager.harvestAndRecompound(positionId, minAmounts)

}

export const withdraw = async (contracts, positionId, amount) => {
  await contracts.positionManager.withdraw(positionId, amount)

}

export const close = async (contracts, positionId) => {
  await contracts.positionManager.close(positionId)
}