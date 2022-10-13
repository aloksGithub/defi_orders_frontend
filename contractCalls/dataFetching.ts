import { ethers } from "ethers";
import erc20Abi from "../constants/abis/ERC20.json"

export const fetchPositions = async (contracts, signer) => {
  const account = await signer.getAddress()
  const numPositions = await contracts.positionManager.numUserPositions(account)
  const positions = []
  const positionsArray = Array.from(Array(numPositions.toNumber()).keys())
  const positionsData = positionsArray.map(i=> 
    contracts.positionManager.userPositions(account, i).then(async (position)=>{
      const positionData = await contracts.positionManager.getPosition(position.toNumber())
      const usdcValue = await contracts.positionManager.callStatic.closeToUSDC(position.toNumber())
      const usdcDecimals = await contracts.usdcContract.decimals()
      const bankDetails = await contracts.banks[positionData.bankId.toNumber()].decodeId(positionData.bankToken)
      const rewards = await contracts.banks[positionData.bankId.toNumber()].getRewards(positionData.bankToken)
      let name
      try {
        const depositedAsset = new ethers.Contract(bankDetails[0], erc20Abi, signer)
        name = await depositedAsset.name()
      } catch {
        const depositedAsset = new ethers.Contract(bankDetails[1], erc20Abi, signer)
        name = await depositedAsset.name()
      }
      let underlying = await contracts.universalSwap.callStatic.getUnderlying(bankDetails[0])
      underlying = await Promise.all(underlying.map(async (token) => {
        const contract = new ethers.Contract(token, erc20Abi, signer)
        const name = await contract.name()
        return name
      }))
      const newPosition = {positionId: position.toNumber(), positionData, tokenContract:bankDetails[0], name, usdcValue: usdcValue.div(ethers.utils.parseUnits("1.0", usdcDecimals)).toString(), rewards, underlying}
      positions.push(newPosition)
    })
  )
  await Promise.all(positionsData)
  return positions
}

export const fetchPosition = async (id:number, contracts, signer) => {
  const positionData = await contracts.positionManager.getPosition(id)
  const usdcValue = await contracts.positionManager.callStatic.closeToUSDC(id)
  const usdcDecimals = await contracts.usdcContract.decimals()
  const bankDetails = await contracts.banks[positionData.bankId.toNumber()].decodeId(positionData.bankToken)
  const rewards = await contracts.banks[positionData.bankId.toNumber()].getRewards(positionData.bankToken)
  let name
  try {
    const depositedAsset = new ethers.Contract(bankDetails[0], erc20Abi, signer)
    name = await depositedAsset.name()
  } catch {
    const depositedAsset = new ethers.Contract(bankDetails[1], erc20Abi, signer)
    name = await depositedAsset.name()
  }
  let underlying = await contracts.universalSwap.callStatic.getUnderlying(bankDetails[0])
  underlying = await Promise.all(underlying.map(async (token) => {
    const contract = new ethers.Contract(token, erc20Abi, signer)
    const name = await contract.name()
    return name
  }))
  const position = {
    positionId: id, positionData,
    tokenContract:bankDetails[0],
    name,
    usdcValue: parseFloat(ethers.utils.formatUnits(usdcValue, usdcDecimals)),
    rewards,
    underlying}
  return position
}

export const getGraphData = async (contracts, id, provider, duration) => {
  const usdcDecimals = await contracts.usdcContract.decimals()
  const blocks = []
  const timestamps = []
  const numPoints = 30
  const latestBlock = await provider.getBlock("latest")
  const currentTime = latestBlock.timestamp
  const previousTimestamp = (await provider.getBlock(latestBlock.number-1)).timestamp
  const blockTime = currentTime-previousTimestamp
  let startBlock
  if (duration===-1) {
    startBlock = (await contracts.positionManager.getPositionInteractions(id))[0][0].toNumber()
    startBlock += (latestBlock.number-startBlock)%numPoints
  } else {
    startBlock = latestBlock.number-blockTime*numPoints*duration
  }
  blocks.push(startBlock)
  while (true) {
    const block = blocks[blocks.length-1]+(latestBlock.number-startBlock)/numPoints
    const timestamp = (await provider.getBlock(block)).timestamp
    timestamps.push(timestamp*1000)
    if (block>=latestBlock.number || blocks.length===30) {
      break
    }
    blocks.push(block)
  }
  blocks.push(latestBlock.number)
  const timestamp = (await provider.getBlock(latestBlock.number)).timestamp
  timestamps.push(timestamp*1000)
  const dataPoints = blocks.map((block)=> {
    return contracts.positionManager.callStatic.closeToUSDC(id, {blockTag: block})
  })
  let usdValues = await Promise.all(dataPoints)
  usdValues = usdValues.map(value=>parseFloat(ethers.utils.formatUnits(value.toString(), usdcDecimals)))
  let graphData = timestamps.map((timestamp, index) => {
    const time = new Date(timestamp)
    if (timestamps[timestamps.length-1]-timestamps[0]<86400000) {
      return {
        name: time.toTimeString().split(' ')[0].slice(0, 5),
        value: usdValues[index].toFixed(4)
      }
    } else {
      return {
        name: time.toLocaleDateString(),
        value: usdValues[index].toFixed(4)
      }
    }
  })
  return graphData
}

export const fetchImportantPoints = async (contracts, id, provider) => {
  const usdcDecimals = await contracts.usdcContract.decimals()
  const data = []
  let usdcDeposited = 0
  let usdcWithdrawn = 0
  
  const positionInteractions = await contracts.positionManager.getPositionInteractions(id)
  await Promise.all(positionInteractions.map(async (interaction, index)=> {
    const block = interaction[0].toNumber()
    const interactionType = interaction[1].toNumber()
    const timestamp = (await provider.getBlock(block)).timestamp
    const date = (new Date(timestamp * 1000)).toLocaleDateString()
    const blockData = (await contracts.positionManager.functions.getPosition(id, {blockTag: block}))[0]
    const size = blockData.amount
    let prevSize = 0
    let prevUsdcValue = 0
    if (index>0) {
      const prevBlockData = (await contracts.positionManager.functions.getPosition(id, {blockTag: block-1}))[0]
      prevUsdcValue = await contracts.positionManager.callStatic.closeToUSDC(id, {blockTag: block-1})
      prevSize = prevBlockData.amount
    }
    const blockUsdcValue = await contracts.positionManager.callStatic.closeToUSDC(id, {blockTag: block})
    const usdcChange = parseFloat(ethers.utils.formatUnits(blockUsdcValue.sub(prevUsdcValue).toString(), usdcDecimals))
    const sizeChange = size.sub(prevSize).toString()
    let transactionType
    switch (interactionType) {
      case 0: {
        transactionType = 'Deposit'
        break
      } case 1: {
        transactionType = 'Withdrawal'
        break
      } case 2: {
        transactionType = 'Harvest'
        break
      } case 3: {
        transactionType = 'Compound'
        break
      } case 4: {
        transactionType = 'Bot Liquidate'
        break
      }
    }
    if (transactionType==='Deposit'||transactionType==='Compound') {
      usdcDeposited+=usdcChange
    } else if (transactionType==='Withdrawal'||transactionType==='Bot Liquidate'||transactionType==='Harvest') {
      usdcWithdrawn-=usdcChange
    }
    data.push({
      transactionType,
      date,
      timestamp,
      usdc: Math.abs(usdcChange),
      tokens: sizeChange
    })
  }))
  // const interactionsArray = Array.from(Array(numInteractions).keys())
  // const interactionsData = interactionsArray.map(i=> 
  //   contracts.positionManager.positionInteractions(id, i).then(async (b)=>{
  //     const block = b.toNumber()
  //     const timestamp = (await provider.getBlock(block)).timestamp
  //     const date = (new Date(timestamp * 1000)).toLocaleDateString()
  //     const blockData = (await contracts.positionManager.functions.getPosition(id, {blockTag: block}))[0]
  //     const size = blockData.amount
  //     let prevSize = 0
  //     let prevUsdcValue = 0
  //     if (i>0) {
  //       const prevBlockData = (await contracts.positionManager.functions.getPosition(id, {blockTag: block-1}))[0]
  //       prevUsdcValue = await contracts.positionManager.callStatic.closeToUSDC(id, {blockTag: block-1})
  //       prevSize = prevBlockData.amount
  //     }
  //     const blockUsdcValue = await contracts.positionManager.callStatic.closeToUSDC(id, {blockTag: block})
  //     const usdcChange = parseFloat(ethers.utils.formatUnits(blockUsdcValue.sub(prevUsdcValue).toString(), usdcDecimals))
  //     const sizeChange = size.sub(prevSize).toString()
  //     const transactionType = usdcChange>0?'deposit':'withdrawal'
  //     if (transactionType==='deposit') {
  //       usdcDeposited+=usdcChange
  //     } else {
  //       usdcWithdrawn-=usdcChange
  //     }
  //     data.push({
  //       transactionType,
  //       date,
  //       timestamp,
  //       usdc: Math.abs(usdcChange),
  //       tokens: sizeChange
  //     })
  //   })
  // )
  // await Promise.all(interactionsData)
  data.sort((a,b) => a.timestamp - b.timestamp)
  return {data, usdcDeposited, usdcWithdrawn}
}

export const getRewards = async (contracts) => {

}