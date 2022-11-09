import { AddIcon, DeleteIcon, ArrowForwardIcon } from '@chakra-ui/icons'
import { useAppContext } from "../components/Provider"
import {
  NumberInput,
  NumberInputField,
  Text,
  Button,
  Flex,
  Box,
  useDisclosure, NumberDecrementStepper, NumberIncrementStepper, NumberInputStepper, Skeleton, Input, Grid, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay
} from '@chakra-ui/react'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import { ethers } from 'ethers'
import erc20Abi from "../constants/abis/ERC20.json"
import poolAbi from "../constants/abis/IUniswapV3Pool.json"
import { SupplyAssets, SelectAsset } from '../components/selectAssets';
import { TickMath, encodeSqrtRatioX96 } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';
import Fraction from 'fraction.js'
import { getPrice, nFormatter } from '../utils';
import { swap } from '../contractCalls/transactions'
import { BiErrorAlt } from "react-icons/bi"
import { FancyButton } from '../components/Buttons'
import { useRouter } from "next/router";

  // @ts-ignore
const TickPicker = forwardRef(({pool, usdSupplied}, _ref) => {
  const {chainId, slippageControl: {slippage}} = useAppContext()
  const {provider} = useWeb3React()
  const [token0, setToken0] = useState()
  const [token1, setToken1] = useState()
  const [loading, setLoading] = useState(true)
  const [token0Name, setToken0Name] = useState('')
  const [token1Name, setToken1Name] = useState('')
  const [decimals0, setDecimals0] = useState(18)
  const [decimals1, setDecimals1] = useState(18)
  const [token0Main, setToken0Main] = useState(false)
  const [priceLower, setPriceLower] = useState(undefined)
  const [priceUpper, setPriceUpper] = useState(undefined)
  const [tickLower, setTickLower] = useState<number>()
  const [tickUpper, setTickUpper] = useState<number>()
  const [currentSqrtRatio, setCurrentSqrtRatio] = useState(undefined)
  const [currentPrice, setCurrentPrice] = useState(undefined)
  const [ratio, setRatio] = useState([undefined, undefined])
  const [minAmount0, setMinAmount0] = useState(undefined)
  const [minAmount1, setMinAmount1] = useState(undefined)
  const [tickSpacing, seTickSpacing] = useState(10)

  useImperativeHandle(_ref, () => ({
    getUniV3Data: () => {
      return {
        minAmount0,
        minAmount1,
        tickLower,
        tickUpper,
        token0,
        token1,
        decimals0,
        decimals1
      }
    }
  }))

  const getNearestUsableTick = (currentTick: number) => {
    if(currentTick == 0){
        return 0
    }
    const direction = (currentTick >= 0) ? 1 : -1
    currentTick *= direction
    let nearestTick = (currentTick%tickSpacing <= tickSpacing/2) ? currentTick - (currentTick%tickSpacing) : currentTick + (tickSpacing-(currentTick%tickSpacing))
    nearestTick *= direction
    return nearestTick
  }

  const amount0ForLiquidity = (sqrtRatioAX96:JSBI, sqrtRatioBX96:JSBI, liquidity:JSBI) => {
    return JSBI.divide(
      JSBI.divide(
        JSBI.multiply(JSBI.multiply(liquidity, JSBI.BigInt(2**96)), JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96)),
        sqrtRatioBX96
      ),
      sqrtRatioAX96
    )
  }

  const amount1ForLiquidity = (sqrtRatioAX96:JSBI, sqrtRatioBX96:JSBI, liquidity:JSBI) => {
    return JSBI.divide(
      JSBI.multiply(liquidity, JSBI.subtract(sqrtRatioBX96, sqrtRatioAX96)),
      JSBI.BigInt('79228162514264337593543950336')
    )
  }

  const getAmountsForLiquidity = (sqrtRatioX96:JSBI, sqrtRatioAX96:JSBI, sqrtRatioBX96:JSBI, liquidity:JSBI) => {
    let ratio0:JSBI = JSBI.BigInt('0')
    let ratio1:JSBI = JSBI.BigInt('0')
    if (JSBI.lessThanOrEqual(sqrtRatioX96, sqrtRatioAX96)) {
      ratio0 = amount0ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity);
      ratio0 = JSBI.divide(ratio0, JSBI.BigInt(10**decimals0!))
    } else if (JSBI.lessThan(sqrtRatioX96, sqrtRatioBX96)) {
      ratio0 = amount0ForLiquidity(sqrtRatioX96, sqrtRatioBX96, liquidity);
      ratio0 = JSBI.divide(ratio0, JSBI.BigInt(10**decimals0!))
      ratio1 = amount1ForLiquidity(sqrtRatioAX96, sqrtRatioX96, liquidity);
      ratio1 = JSBI.divide(ratio1, JSBI.BigInt(10**decimals1!))
    } else {
      ratio1 = amount1ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity);
      ratio1 = JSBI.divide(ratio1, JSBI.BigInt(10**decimals1!))
    }
    return {ratio0:+ratio0?.toString(), ratio1:+ratio1?.toString()}
  }

  useEffect(() => {
    const calculateMinAmounts = async () => {
      // const {data:{price:price0}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${token0}`)).json()
      // const {data:{price:price1}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${token1}`)).json()
      // const amount0Usd = usdSupplied*ratio[0]/(ratio[0]+ratio[1])
      // const amount1Usd = usdSupplied*ratio[1]/(ratio[0]+ratio[1])
      // const amount0 = amount0Usd/price0
      // const amount1 = amount1Usd/price1
      // setMinAmount0((10**decimals0!*amount0*(100-slippage)/100).toFixed(0))
      // setMinAmount1((10**decimals1!*amount1*(100-slippage)/100).toFixed(0))
      // setLoading(false)
    }
    calculateMinAmounts()
  }, [ratio, token0, token1])

  const calculateSqrtRatio = (price) => {
    let ratio
    if (token0Main) {
      ratio = (1/price)*10**(decimals0-decimals1)
    } else {
      ratio = (price)*10**(decimals0-decimals1)
    }
    let frac = new Fraction(ratio)
    let amount0 = frac.n
    let amount1 = frac.d
    if (frac.n===0) {
      ratio = ratio*10**18
      frac = new Fraction(ratio)
      amount0 = frac.n
      amount1 = frac.d*10**18
    }
    const sqrtPriceX96 = encodeSqrtRatioX96(amount1, amount0)
    return sqrtPriceX96
  }

  useEffect(() => {
    if (priceLower && priceLower>0 && priceUpper && priceUpper>0) {
      const sqrtPriceAX96 = calculateSqrtRatio(priceLower)
      const sqrtPriceBX96 = calculateSqrtRatio(priceUpper)
      if (sqrtPriceAX96 && sqrtPriceBX96) {
        const tickLower = TickMath.getTickAtSqrtRatio(sqrtPriceAX96)
        setTickLower(getNearestUsableTick(tickLower))
        const tickUpper = TickMath.getTickAtSqrtRatio(sqrtPriceBX96)
        setTickUpper(getNearestUsableTick(tickUpper))
        const {ratio0, ratio1} = getAmountsForLiquidity(currentSqrtRatio, sqrtPriceAX96, sqrtPriceBX96, JSBI.BigInt('1000000000000000000'))
        setRatio([ratio0, ratio1?ratio1/currentPrice:0])
      }
    }
  }, [priceLower, priceUpper])

  useEffect(() => {
    const fetchData = async () => {
      const poolContract = new ethers.Contract(pool, poolAbi, provider)
      const tickSpacing = await poolContract.tickSpacing()
      seTickSpacing(tickSpacing)
      const token0 = await poolContract.token0()
      const token1 = await poolContract.token1()
      setToken0(token0)
      setToken1(token1)
      const token0Contract = new ethers.Contract(token0, erc20Abi, provider)
      const token1Contract = new ethers.Contract(token1, erc20Abi, provider)
      const decimals0 = await token0Contract.decimals()
      const decimals1 = await token1Contract.decimals()
      setDecimals0(decimals0)
      setDecimals1(decimals1)
      const token0Name = await token0Contract.symbol()
      const token1Name = await token1Contract.symbol()
      const {sqrtPriceX96, tick} = await poolContract.slot0()
      const token1Price = (2 ** 192 / sqrtPriceX96 ** 2)/10**(decimals0-decimals1)
      const token0Price = (sqrtPriceX96 ** 2 / 2 ** 192)/10**(decimals1-decimals0)
      const token0Main = token0Price>token1Price
      setCurrentSqrtRatio(JSBI.BigInt(sqrtPriceX96))
      setCurrentPrice(token1Price)
      setToken0Main(token0Main)
      setToken0Name(token0Name)
      setToken1Name(token1Name)
      setPriceLower(token0Main?(token0Price-0.001).toFixed(3):(token1Price-0.001).toFixed(3))
      setPriceUpper(token0Main?(token0Price+0.001).toFixed(3):(token1Price+0.001).toFixed(3))
    }
    try {
      setLoading(true)
      fetchData()
    } catch {
      console.log("ERROR")
    }
  }, [pool])

  return (
    <>
      {
        loading?
        <Flex mt={'4'} justifyContent={'space-around'}>
        <Skeleton width={'150px'} height='40px' />
        <Skeleton width={'150px'} height='40px' />
        </Flex>:
        <Flex mt={'4'} justifyContent={'space-around'}>
        <Box>
        <Text>Min {token0Main?token0Name:token1Name} per {token0Main?token1Name:token0Name}</Text>
        <NumberInput min={0} max={priceUpper} maxW={'150px'} value={priceLower} precision={3} step={0.001} onChange={(valueAsNumber)=>setPriceLower(valueAsNumber)}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        </Box>
        <Box>
        <Text>Max {token0Main?token0Name:token1Name} per {token0Main?token1Name:token0Name}</Text>
        <NumberInput min={priceLower} maxW={'150px'} value={priceUpper} precision={3} step={0.001} onChange={(valueAsNumber)=>setPriceUpper(valueAsNumber)}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        </Box>
        </Flex>
      }
    </>
  )
})

const WantedAsset = ({usdSupplied, selected, setSelected, updateExpected, changePercentage, deleteSelf}) => {
  const {supportedAssets, chainId} = useAppContext()
  const {slippageControl: {slippage}} = useAppContext()
  const assetsArray = [].concat.apply([], Object.values(supportedAssets))
  const [expected, setExpected] = useState(0)
  const [price, setPrice] = useState(0)
  const [loadingSelf, setLoadingSelf] = useState(false)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingSelf(true)
      reload()
    }, 60000);
    return () => clearInterval(interval)
  }, [])
  
  const minOut = (expected||0)*(100-slippage)/100
  const minUsd = (minOut*price)

  const reload = async () => {
    if (selected.contract_address) {
      const price = await getPrice(chainId, selected.contract_address)
      const expected = (usdSupplied*selected.percentage/100)/price
      setExpected(expected)
      setPrice(price)
      updateExpected(expected)
    }
    setLoadingSelf(false)
  }

  useEffect(() => {
    setLoadingSelf(true)
    reload()
  }, [selected.contract_address])

  useEffect(() => {
    if (price>0) {
      const expected = (usdSupplied*selected.percentage/100)/price
      setExpected(expected)
      updateExpected(expected)
    } else {
      setExpected(0)
      updateExpected(0)
    }
  }, [selected.percentage, usdSupplied])

  return (
    <Flex width={'100%'} mt='4' padding={'4'} justifyContent={'space-between'} alignItems={'center'} borderRadius={'2xl'} backgroundColor={'#f7f7f7'}>
      <Box>
      <SelectAsset assets={assetsArray} asset={selected} onSelect={setSelected}></SelectAsset>
        <Flex alignItems={'center'} mt={'3'}>
          <Text onClick={deleteSelf} mr={'3'} textAlign={'center'} borderRadius={'lg'} width={'2rem'} padding={'1'}
          _hover={{cursor: 'pointer', backgroundColor: 'red.400'}} backgroundColor='red.300'><DeleteIcon/></Text>
          <NumberInput backgroundColor={'white'} maxWidth={'100'} min={0} max={100} value={selected.percentage+'%'} onChange={(valueAsString)=>changePercentage(valueAsString.replace(/^\%/, ''))}>
            <NumberInputField></NumberInputField>
          </NumberInput>
        </Flex>
      </Box>
      <Flex flexDirection={'column'} alignItems={'end'} textAlign={'end'}>
        <Flex>Price: ${!loadingSelf?<Text>{nFormatter(price, 3)}</Text>:<Skeleton>Temp</Skeleton>}</Flex>
        {!loadingSelf?<Input height={'48px'} textAlign={'end'} variant='unstyled' fontSize={'2xl'} size={'lg'} maxWidth='150px' value={expected}></Input>:<Skeleton>Temporary Temporary</Skeleton>}
        {!loadingSelf?<Text>Min: ~{minOut.toFixed(5)} (${minUsd.toFixed(3)})</Text>:<Skeleton>Temporary</Skeleton>}
      </Flex>
    </Flex>
  )
}

const ConvertTo = ({usdSupplied, updateWantedAssets}) => {
  const {slippageControl: {slippage}} = useAppContext()
  const [wantedAssets, setWantedAssets] = useState<any>([{percentage: 100, expected:0, minOut:0}])

  useEffect(() => {
    updateWantedAssets(wantedAssets)
  }, [wantedAssets])

  const addWanted = () => {
    setWantedAssets([...wantedAssets, {percentage: 0, expected:0, minOut:0}])
  }

  const select = (index, asset) => {
    const temp = [...wantedAssets]
    temp[index] = {...temp[index], ...asset}
    setWantedAssets(temp)
  }

  const setExpected = (index, expected) => {
    const temp = [...wantedAssets]
    temp[index].expected = expected
    temp[index].minOut = expected*(100-slippage)/100
  }

  const removeWanted = (index) => {
    if (wantedAssets.length===1) return
    const tempAssets = [...wantedAssets]
    tempAssets.splice(index, 1)
    setWantedAssets(tempAssets)
  }
  
  const updatePercentages = (index:number, percentage:number) => {
    const temp = [...wantedAssets]
    temp[index].percentage = percentage
    setWantedAssets(temp)
  }

  return (
    <Box padding={'5'} width={'100%'} maxWidth='450px' alignItems={'center'} backgroundColor='white' borderRadius={'2xl'}>
      <Flex width={'100%'} justifyContent='space-between' alignItems={'center'}>
          <Button onClick={addWanted} paddingInline={'3'} colorScheme={'blue'}><AddIcon/></Button>
          <Text textAlign={'end'}>Slippage: {slippage}%</Text>
      </Flex>
    {
      wantedAssets.map((asset, index)=>
      <WantedAsset key={`wantedAsset_${index}`} usdSupplied={usdSupplied}
      selected={asset} setSelected={(asset)=>select(index, asset)}
      changePercentage={(percentage)=>updatePercentages(index, percentage)}
      updateExpected={(expected)=>setExpected(index, expected)}
      deleteSelf={()=>removeWanted(index)}/>
      )
    }
    </Box>
  )
}

const UniversalSwap = () => {
  const [assetsToConvert, setAssetsToConvert] = useState([])
  const [wantedAssets, setWantedAssets] = useState([])
  const [usdSupplied, setUsdSupplied] = useState(0)
  const {isOpen, onOpen, onClose} = useDisclosure()
  const [error, setError] = useState('')
  const {contracts, onError, hardRefreshAssets} = useAppContext()
  const {provider, account} = useWeb3React()
  const signer = provider?.getSigner(account)
  const [swapping, setSwapping] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const usdSupplied = assetsToConvert.reduce((a, b)=>a+(b.usdcValue||0), 0)
    setUsdSupplied(usdSupplied)
  }, [assetsToConvert])

  const createError = (error:string) => {
    setError(error)
    onOpen()
  }

  const proceed = () => {
    setSwapping(true)
    if (!contracts.universalSwap) {
      createError('Looks like Delimit contracts have not yet been deployed on this chain, please switch to BSC')
      return
    }
    if (usdSupplied===0) {
      createError(`No USD supplied`)
      return
    }
    for (let i = 0; i<assetsToConvert.length; i++) {
      const asset = assetsToConvert[i]
      if (!asset.contract_address) {
        createError(`Please select asset for supplied asset ${i+1}`)
        return
      }
      if (!asset.tokensSupplied) {
        createError(`Please specify tokens supplied for supplied asset ${i+1}`)
        return
      }
      if (asset.tokensSupplied===0) {
        createError(`Tokens supplied for asset ${i+1} are 0`)
        return
      }
    }
    let percentageTotal = 0
    for (let i = 0; i<wantedAssets.length; i++) {
      const asset = wantedAssets[i]
      percentageTotal+=+asset.percentage
      if (!asset.contract_address) {
        createError(`Please select asset for wanted asset ${i+1}`)
        return
      }
      if (!asset.percentage) {
        createError(`Please specify percentage for wanted asset ${i+1}`)
        return
      }
      if (asset.percentage===0) {
        createError(`Percentage for wanted asset ${i+1} is 0`)
        return
      }
    }
    if (percentageTotal!=100) {
      console.log(percentageTotal)
      createError('Total percentage is not 100%')
      return
    }
    swap(contracts, signer, assetsToConvert, wantedAssets).then(()=>{
      setSwapping(false)
      hardRefreshAssets()
      router.push("/Positions")
    },
    (reason)=>{
      onError(reason)
      setSwapping(false)
    })
  }

  // const swap = async () => {
    // if (!wantedAsset) return
    // if (!contracts.positionManager) return
    // setConverting(true)
    // @ts-ignore
    // let assetsToConvert = childStateRef.current.getFormattedConditions()
    // const etherSupplied = assetsToConvert.find(asset=>[ethers.constants.AddressZero].includes(asset.asset))?.tokensBn || 0
    // assetsToConvert = assetsToConvert.filter(asset=>![ethers.constants.AddressZero].includes(asset.asset))
    // const erc20Supplied = assetsToConvert.map(asset=>asset.asset)
    // const erc20Amounts = assetsToConvert.map(asset=>asset.tokensBn)
    // for (let [index, token] of erc20Supplied.entries()) {
    //   const contract = new ethers.Contract(token, erc20Abi, provider.getSigner(account))
    //   const currentApproval = await contract.allowance(account, contracts.universalSwap.address)
    //   if (currentApproval.gte(erc20Amounts[index])) {
    //     continue
    //   }
    //   try {
    //     await contract.functions.approve(contracts.universalSwap.address, erc20Amounts[index])
    //   } catch (error) {
    //     onError(error)
    //     return
    //   }
    // }
    // if (uniV3Pool) {
    //   try {
    //     // @ts-ignore
    //     const {tickLower, tickUpper, token0, token1, decimals0, decimals1} = childStateRef2.current.getUniV3Data()
    //     const ratio = await contracts.uniswapV3PoolInteractor.getRatio(wantedAsset.value, tickLower, tickUpper)
    //     const {data:{price:price0}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${token0}`)).json()
    //     const {data:{price:price1}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${token1}`)).json()
    //     const amount0Usd = ratio[0].mul((totalToConvert*10**6).toFixed(0)).div(ratio[0].add(ratio[1]))
    //     const amount1Usd = ratio[1].mul((totalToConvert*10**6).toFixed(0)).div(ratio[0].add(ratio[1]))
    //     const amount0 = amount0Usd/(price0*10**6)
    //     const amount1 = amount1Usd/(price1*10**6)
    //     const minAmount0 = (10**decimals0!*amount0*(100-slippage)/100).toFixed(0)
    //     const minAmount1 = (10**decimals1!*amount1*(100-slippage)/100).toFixed(0)
    //     const abi = ethers.utils.defaultAbiCoder;
    //     const data = abi.encode(
    //       ["int24","int24","uint256","uint256"],
    //       [tickLower, tickUpper, minAmount0, minAmount1]);
    //     await contracts.universalSwap.swapERC721(erc20Supplied, erc20Amounts,
    //       [], {pool:wantedAsset.value, manager:wantedAsset.manager, tokenId: 0, liquidity:0, data},
    //       {value: etherSupplied})
    //     setConverting(false)
    //     onClose()
    //   } catch (err) {
    //     onError(err)
    //     setConverting(false)
    //   }
    // } else {
    //   const {data:{price, decimals}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${wantedAsset.value}`)).json()
    //   const expectedTokens = totalToConvert/price
    //   const allowedSlippage = expectedTokens*(1-slippage/100)
    //   const minAmount = ethers.utils.parseUnits(allowedSlippage.toFixed(decimals).toString(), decimals)
    //   contracts.universalSwap.swapERC20(erc20Supplied, erc20Amounts, [], wantedAsset.value, minAmount, {value: etherSupplied}).then(() => {
    //     setTimeout(() => {
    //       setConverting(false)
    //       ethers.getDefaultProvider().getBlockNumber()
    //       onClose()
    //     }, 6000);
    //   }).catch((error)=>{
    //     setConverting(false)
    //     onClose()
    //     onError(error)
    //   })
    // }
  // }
  return (
    <Flex marginBlock={10} alignItems={'center'} direction={'column'}>
      <Grid width={'100%'} templateColumns={{base: '1fr', lg: '6fr 1fr 6fr'}}>
        <Flex justifyContent={{lg: 'end', base:'center'}}>
          <SupplyAssets onChange={setAssetsToConvert}/>
        </Flex>
        <Flex marginBlock={{lg: '24', base: '5'}} justifyContent={'center'} >
          <ArrowForwardIcon transform={{base:'rotate(90deg)', lg: 'rotate(0deg)'}} fontSize={'2rem'}/>
        </Flex>
        <Flex justifyContent={{lg: 'start', base:'center'}}>
          <ConvertTo usdSupplied={usdSupplied} updateWantedAssets={setWantedAssets}></ConvertTo>
        </Flex>
      </Grid>
      <FancyButton isLoading={swapping} mt='20' height='85px' width='70%' onClick={proceed}><Text fontSize={'3xl'} color={'white'}>Swap</Text></FancyButton>
      <Modal size={'sm'} isCentered isOpen={isOpen} onClose={onClose}>
        <ModalOverlay
          bg='blackAlpha.300'
          backdropFilter='blur(10px)'
        />
        <ModalContent>
          <ModalHeader>
            <Flex alignItems={'center'}>
              {<BiErrorAlt color='red' fontSize={'2rem'}/>}
              <Text ml={'4'}>Error</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{error}</Text>
          </ModalBody>
          <ModalFooter>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

export default UniversalSwap