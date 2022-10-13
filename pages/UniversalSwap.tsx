import { AddIcon, MinusIcon, ArrowBackIcon } from '@chakra-ui/icons'
import { useAppContext } from "../components/Provider"
import {
  Table,
  Thead,
  Tbody,
  NumberInput,
  NumberInputField,
  Tr,
  Th,
  Td,
  Text,
  TableContainer,
  Button,
  Flex,
  Box,
  useDisclosure, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, useColorModeValue, ModalOverlay, Heading, NumberDecrementStepper, NumberIncrementStepper, NumberInputStepper, Skeleton
} from '@chakra-ui/react'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
  Select,
} from "chakra-react-select";
import { useWeb3React } from '@web3-react/core'
import { ethers } from 'ethers'
import erc20Abi from "../constants/abis/ERC20.json"
import poolAbi from "../constants/abis/IUniswapV3Pool.json"
import { SupplyAssets } from '../components/selectAssets';
import { TickMath, encodeSqrtRatioX96 } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';
import Fraction from 'fraction.js'

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

const UniversalSwap = () => {
  const childStateRef = useRef()
  const childStateRef2 = useRef()
  const {account, chainId, supportedAssets, contracts, slippageControl: {slippage}} = useAppContext()
  const {provider} = useWeb3React()
  
  const [totalToConvert, setTotal] = useState(0)
  const [wantedAsset, setWantedAsset] = useState<any>()
  const assetsArray = [].concat.apply([], Object.values(supportedAssets))
  const [converting, setConverting] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [uniV3Pool, setUniV3Pool] = useState(undefined)

  const proceed = () => {
    // @ts-ignore
    const assetsToConvert = childStateRef.current.getFormattedConditions()
    if (!assetsToConvert || assetsToConvert.length===0) return
    const usdToConvert = assetsToConvert.reduce((prev, asset)=>prev+asset.usdcValue, 0)
    if (usdToConvert==0) return
    setWantedAsset(undefined)
    setUniV3Pool(undefined)
    onOpen()
    setTotal(usdToConvert)
  }

  const onChangeWanted = async (wanted) => {
    setWantedAsset(wanted)
    if (wanted.label.slice(0, 10)==='Uniswap V3') {
      setUniV3Pool(wanted.value)
    } else {
      setUniV3Pool(undefined)
    }
  }

  const swap = async () => {
    if (!wantedAsset) return
    setConverting(true)
    // @ts-ignore
    let assetsToConvert = childStateRef.current.getFormattedConditions()
    const etherSupplied = assetsToConvert.find(asset=>asset.asset==="0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")?.tokensBn || 0
    assetsToConvert = assetsToConvert.filter(asset=>asset.asset!="0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
    const erc20Supplied = assetsToConvert.map(asset=>asset.asset)
    const erc20Amounts = assetsToConvert.map(asset=>asset.tokensBn)
    for (let [index, token] of erc20Supplied.entries()) {
      const contract = new ethers.Contract(token, erc20Abi, provider.getSigner(account))
      const currentApproval = await contract.allowance(account, contracts.universalSwap.address)
      if (currentApproval.gte(erc20Amounts[index])) {
        continue
      }
      try {
        await contract.functions.approve(contracts.universalSwap.address, erc20Amounts[index])
      } catch {
        console.log("Transaction failed")
      }
    }
    if (uniV3Pool) {
      try {
        // @ts-ignore
        const {tickLower, tickUpper, token0, token1, decimals0, decimals1} = childStateRef2.current.getUniV3Data()
        const ratio = await contracts.uniswapV3PoolInteractor.getRatio(wantedAsset.value, tickLower, tickUpper)
        const {data:{price:price0}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${token0}`)).json()
        const {data:{price:price1}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${token1}`)).json()
        const amount0Usd = ratio[0].mul((totalToConvert*10**6).toFixed(0)).div(ratio[0].add(ratio[1]))
        const amount1Usd = ratio[1].mul((totalToConvert*10**6).toFixed(0)).div(ratio[0].add(ratio[1]))
        const amount0 = amount0Usd/(price0*10**6)
        const amount1 = amount1Usd/(price1*10**6)
        const minAmount0 = (10**decimals0!*amount0*(100-slippage)/100).toFixed(0)
        const minAmount1 = (10**decimals1!*amount1*(100-slippage)/100).toFixed(0)
        const abi = ethers.utils.defaultAbiCoder;
        const data = abi.encode(
          ["int24","int24","uint256","uint256"],
          [tickLower, tickUpper, minAmount0, minAmount1]);
        await contracts.universalSwap.swapERC721(erc20Supplied, erc20Amounts,
          [], {pool:wantedAsset.value, manager:wantedAsset.manager, tokenId: 0, liquidity:0, data},
          {value: etherSupplied})
        setConverting(false)
        onClose()
      } catch (err) {
        console.log("Transaction failed", err)
        setConverting(false)
      }
    } else {
      const {data:{price, decimals}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${wantedAsset.value}`)).json()
      const expectedTokens = totalToConvert/price
      const allowedSlippage = expectedTokens*(1-slippage/100)
      const minAmount = ethers.utils.parseUnits(allowedSlippage.toFixed(decimals).toString(), decimals)
      try {
        console.log(etherSupplied.toString())
        await contracts.universalSwap.swapERC20(erc20Supplied, erc20Amounts, [], wantedAsset.value, minAmount, {value: etherSupplied})
        setConverting(false)
        onClose()
      } catch {
        console.log("Transaction failed")
        setConverting(false)
      }
    }
  }
  return (
    <Flex marginBlock={10} alignItems={'center'} direction={'column'}>
      <Heading mb={'4'}>Select Assets to Swap</Heading>
      <SupplyAssets ref={childStateRef}/>
      <Flex marginTop={5} marginBottom={25} justifyContent={'end'}>
      <Button colorScheme='blue' rounded={'full'} mr={'4'} size='lg' onClick={proceed}>Proceed</Button>
      </Flex>
      <Modal isCentered isOpen={isOpen} onClose={onClose}>
      <ModalOverlay
        bg='blackAlpha.300'
        backdropFilter='blur(10px)'
      />
        <ModalContent>
          <ModalHeader>Convert Assets</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>USD Supplied ${totalToConvert.toFixed(3)}</Text>
            <Text mb={3}>Convert To:</Text>
            <Select
              size="sm"
              colorScheme="purple"
              options={assetsArray}
              placeholder={"Enter address or asset name"}
              onChange={(newValue)=>onChangeWanted(newValue)}
            />
            {
              uniV3Pool?
              // @ts-ignore
              <TickPicker pool={uniV3Pool} usdSupplied={totalToConvert} ref={childStateRef2}/>:<></>
            }
            <Flex justifyContent={'center'}>
            <Button mt={4} onClick={swap} isLoading={converting}>Convert</Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

export default UniversalSwap