import { ethers } from "ethers";
import erc20Abi from "../constants/abis/ERC20.json"

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

export const swap = async (contracts, signer, assetsToConvert, wantedAssets, slippage) => {
  const account = await signer.getAddress()
  const inputTokens = []
  const inputTokenAmounts = []
  const outputTokens = []
  const outputRatios = []
  const minAmountsOut = []
  for (const asset of assetsToConvert) {
    const assetContract = new ethers.Contract(asset.contract_address, erc20Abi, signer)
    const tokensSupplied = ethers.utils.parseUnits(asset.tokensSupplied, asset.contract_decimals)
    const currentAllowance = await assetContract.allowance(account, contracts.universalSwap.address)
    if (currentAllowance<tokensSupplied) {
      await assetContract.approve(contracts.universalSwap.address, tokensSupplied)
    }
    inputTokens.push(asset.contract_address)
    inputTokenAmounts.push(tokensSupplied)
  }
  for (const asset of wantedAssets) {
    outputTokens.push(asset.contract_address)
    minAmountsOut.push(ethers.utils.parseUnits(asset.minOut, asset.contract_decimals))
    outputRatios.push(asset.percentage*10000)
  }
  await contracts.universalSwap.swap(inputTokens, inputTokenAmounts, outputTokens, outputRatios, minAmountsOut)
}

export const depositAgain = async (contracts, signer, position, assetsToConvert, chainId, slippage) => {
  if (assetsToConvert[0].asset!=ethers.constants.AddressZero) {
    const account = await signer.getAddress()
    const usdTotal = assetsToConvert.reduce((a, b)=>a+b.usdcValue, 0)
    const bankId = position.positionData.bankId.toNumber()
    const bankContract = contracts.banks[bankId]
    const underlyingTokens = await bankContract.callStatic.getUnderlyingForRecurringDeposit(position.positionData.bankToken)
    const minAmounts = []
    for (const token of underlyingTokens) {
      const {data:{price, decimals}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${token}`)).json()
      const usd = usdTotal/underlyingTokens.length
      const expectedTokens = usd/price
      const allowedSlippage = expectedTokens*(1-slippage/100)
      const minAmount = ethers.utils.parseUnits(allowedSlippage.toFixed(decimals).toString(), decimals)
      minAmounts.push(minAmount)
    }
    const addresses = assetsToConvert.map(asset=>asset.asset)
    const amounts = assetsToConvert.map(asset=>ethers.utils.parseUnits(asset.tokensSupplied.toString(), asset.tokenDecimals))
    for (const [index, address] of addresses.entries()) {
      const contract = new ethers.Contract(address, erc20Abi,signer)
      const allowance = await contract.allowance(account, contracts.positionManager.address)
      if (allowance.toString()<amounts[index].toString()){
        await contract.approve(contracts.positionManager.address, amounts[index])
      }
    }
    await contracts.positionManager["deposit(uint256,address[],uint256[],uint256[])"](position.positionId, addresses, amounts, minAmounts)
  } else {
    const amount = ethers.utils.parseUnits(assetsToConvert[0].tokensSupplied.toString(), assetsToConvert[0].tokenDecimals)
    await contracts.positionManager["deposit(uint256,address[],uint256[],uint256[])"](position.positionId, [], [], [], {value: amount})
  }
}

export const adjustLiquidationPoints = async (contracts, positionId, liquidationConditions) => {
  await contracts.positionManager.adjustLiquidationPoints(positionId, liquidationConditions)
}

export const harvest = async (contracts, positionId) => {
  await contracts.positionManager.harvestRewards(positionId)
}

export const compound = async (contracts, positionId) => {
  await contracts.positionManager.harvestAndRecompound(positionId)

}

export const withdraw = async (contracts, positionId, amount) => {
  await contracts.positionManager.withdraw(positionId, amount)

}

export const close = async (contracts, positionId) => {
  await contracts.positionManager.close(positionId)
}