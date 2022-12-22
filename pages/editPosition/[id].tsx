import { useAppContext } from "../../components/Provider"
import { Box, Flex, Text, Button, Grid, GridItem, NumberInput, NumberInputField, useDisclosure, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Slider, SliderFilledTrack, SliderThumb, SliderTrack, useColorModeValue, ModalFooter } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/router'
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { fetchPosition, FetchPositionData, getAmountsOut } from "../../contractCalls/dataFetching";
import { depositAgain, close, withdraw, adjustLiquidationPoints } from "../../contractCalls/transactions";
import LiquidationConditions from "../../components/LiquidationConditions";
import { SupplyAssets } from "../../components/selectAssets";
import { Heading2 } from "../../components/Typography";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { getBlockExplorerUrlTransaction, getPrice, nFormatter } from "../../utils";
import { BiErrorAlt } from "react-icons/bi";
import { level0, level1 } from "../../components/Theme";
import { Asset, defaultUserAssetSupplied, defaultWantedAsset, LiquidationCondition, UserAssetSupplied } from "../../Types";
import { LiquidationConditionStruct } from "../../codegen/PositionManager";

const WithdrawModal = ({position, refreshData, closeSelf}: {position: FetchPositionData, refreshData:Function, closeSelf: Function}) => {
  const positionSizeDecimals = +position?.formattedAmount||0
  const {contracts, onError, chainId, successModal} = useAppContext()
  const [value, setValue] = useState(0)
  const [isWithdrawing, setWithdrawing] = useState(false)
  const [percentage, setPercentage] = useState('0')
  const usdWithdraw = (value/positionSizeDecimals)*position.usdcValue || 0
  const handleChange = (value) => {
    setValue(+value)
    setPercentage((value*100/positionSizeDecimals).toFixed(1))
  }
  const hangleChangeSlider = (value) => {
    setPercentage(value)
    setValue(positionSizeDecimals*value/100)
  }
  const withdrawFromPostion = () => {
    if (value===0) return
    console.log(typeof(value))
    setWithdrawing(true)
    withdraw(contracts, position.positionId, ethers.utils.parseUnits(value.toFixed(position.decimals), position.decimals)).then((hash)=>{
      setWithdrawing(false)
      refreshData()
      closeSelf()
      successModal("Withdrawal Successful", 
        <Text>
          Assets were withdrawn successfully, 
          View <a href={getBlockExplorerUrlTransaction(chainId, hash)} target="_blank" rel="noopener noreferrer"><Text as='u' textColor={'blue.500'}>transaction</Text></a>
          &nbsp;on block explorer.
        </Text>
      )
    }).catch((error)=>{
      onError(error)
      setWithdrawing(false)
    })
  }
  return (
    <Box>
      <Box backgroundColor={useColorModeValue(...level0)} padding='4' borderRadius={'lg'}>
        <Flex mb={'4'} justifyContent={'space-between'}>
          <Box>
            <Text as={'b'} mr={'4'}>USD Value:</Text>
            <Flex alignItems={'center'}>
              <Text>${usdWithdraw.toFixed(4)}</Text>
            </Flex>
          </Box>
          <Box mb={'4'}>
            <Text as={'b'} mr={'4'}>Available:</Text>
            <Text>{nFormatter(positionSizeDecimals, 5)}</Text>
          </Box>
        </Flex>
        <Box margin={'auto'} width={'100%'}>
          <NumberInput bgColor='hidden' min={0} max={positionSizeDecimals} value={value} onChange={handleChange} size='lg'>
            <NumberInputField bgColor={useColorModeValue('white', 'gray.900')}/>
          </NumberInput>
          <Box width={'93%'} margin='auto'>
          <Slider aria-label='slider-ex-1'
            textColor='black'
            flex='1'
            focusThumbOnChange={false}
            value={+percentage}
            max={100}
            onChange={hangleChangeSlider}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb fontSize='sm' boxSize='32px' children={percentage} />
          </Slider>
          </Box>
        </Box>
      </Box>
      <Flex mt={'4'} justifyContent={'center'}>
      <PrimaryButton isLoading={isWithdrawing} size='large' margin={'auto'} onClick={withdrawFromPostion}>Withdraw</PrimaryButton>
      </Flex>
    </Box>
  )
}

const DepositModal = ({position, refreshData, closeSelf}: {position: FetchPositionData, refreshData: Function, closeSelf: Function}) => {
  const [assetsToConvert, setAssetsToConvert] = useState<UserAssetSupplied[]>([defaultUserAssetSupplied])
  const {contracts, chainId, slippageControl: {slippage}, onError} = useAppContext()
  const {provider ,account} = useWeb3React()
  const {successModal} = useAppContext()
  const [isDepositing, setDepositing] = useState(false)
  
  const supply = async () => {
    setDepositing(true)
    depositAgain(contracts,provider?.getSigner(account), position, assetsToConvert, chainId, slippage).then((hash)=>{
      setDepositing(false)
      refreshData()
      closeSelf()
      successModal("Deposit Successful", 
        <Text>
          Asset was deposited successfully, 
          View <a href={getBlockExplorerUrlTransaction(chainId, hash)} target="_blank" rel="noopener noreferrer"><Text as='u' textColor={'blue.500'}>transaction</Text></a>
          &nbsp;on block explorer.
        </Text>
      )
    }).catch((error)=>{
      setDepositing(false)
      onError(error)
    })
  }

  return (
    <Flex bgColor={useColorModeValue('white', 'gray.900')} alignItems={'center'} direction={'column'} width={'100%'}>
      <Box width={'100%'}>
        <div style={{overflow: 'auto', maxHeight: '60vh'}}>
        <Flex width={'100%'} justifyContent={'center'}>
          <SupplyAssets assetsToConvert={assetsToConvert} setAssetsToConvert={setAssetsToConvert}/>
        </Flex>
        </div>
        <Flex mt={'6'} justifyContent={'center'}><PrimaryButton isLoading={isDepositing} size='large' onClick={supply}>Deposit</PrimaryButton></Flex>
      </Box>
    </Flex>
  )
}

const EditPosition = () => {
  const {contracts, chainId, supportedAssets, onError, successModal} = useAppContext()
  const {provider, account} = useWeb3React()
  const signer = provider?.getSigner(account)
  const router = useRouter()
  const { id } = router.query
  if (typeof id != 'string') return <></>
  // const position = userPositions?.find((position)=>position.positionId.toString()===id)
  const [position, setPosition] = useState<FetchPositionData>()
  const [initialLiquidationPoints, setInitialLiquidationPoints] = useState<LiquidationCondition[]>([])
  const [isClosing, setClosing] = useState(false)
  const [isAdjusting, setAdjusting] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const { isOpen: isDepositOpen, onOpen: onDepositOpen, onClose: onDepositClose } = useDisclosure();
  const { isOpen: isWithdrawOpen, onOpen: onWithdrawOpen, onClose: onWithdrawClose } = useDisclosure();
  const { isOpen: isCloseOpen, onOpen: onCloseOpen, onClose: onCloseClose } = useDisclosure();
  const [error, setError] = useState("")
  const { isOpen: errorOpen, onOpen: openError, onClose: closeError } = useDisclosure();
  const [resetFlag, setResetFlag] = useState(false)
  // @ts-ignore
  const liquidationPoints = position?.positionData.liquidationPoints
  const [liquidationConditions, setLiquidationConditions] = useState<LiquidationCondition[]>()
  const [reloadTrigger, setReloadTrigger] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrongUser = position?.positionData.user&&position?.positionData.user!=account

  useEffect(() => {
    if (wrongUser) {
      setError(`Wrong wallet address connected`)
      openError()
    }
  }, [wrongUser])

  useEffect(() => {
    const fetch = async () => {
      // @ts-ignore
      const position = await fetchPosition(parseInt(id), contracts, provider?.getSigner(account), chainId)
      setPosition(position)
      setLoading(false)
    }
    if (contracts && provider) {
      setLoading(true)
      fetch()
    }
  }, [contracts, provider, id, refresh, reloadTrigger])

  useEffect(() => {
    const formatLiquidationPoints = async () => {
      const promises = liquidationPoints.map(async point=> {
        let watchedAsset: Asset
        let price: number
        if (point.watchedToken===contracts.positionManager.address) {
          watchedAsset = {
            contract_name: 'Value of self',
            contract_ticker_symbol: 'Self',
            contract_address: contracts.positionManager.address,
            underlying:[],
            contract_decimals: 18,
            protocol_name: '',
            chain_id: chainId,
            logo_url: 'https://www.svgrepo.com/show/99387/dollar.svg'
          }
          price = position?.usdcValue
        } else {
          watchedAsset = supportedAssets.find((asset:any)=>asset.contract_address.toLowerCase()===point.watchedToken.toLowerCase())
          price = (await getPrice(chainId, point.watchedToken)).price
        }
        const convertTo = supportedAssets.find((asset:any)=>asset.contract_address.toLowerCase()===point.liquidateTo.toLowerCase())
        const lessThan: boolean = point.lessThan
        const liquidationPoint = +ethers.utils.formatUnits(point.liquidationPoint.toString(), 18)
        const slippage = +ethers.utils.formatUnits(point.slippage, 18)*100
        return {watchedAsset, convertTo, lessThan, liquidationPoint, price, slippage}
      })
      const formattedLiquidationPoints: LiquidationCondition[] = await Promise.all(promises)
      setInitialLiquidationPoints(JSON.parse(JSON.stringify(formattedLiquidationPoints)))
    }
    if (liquidationPoints) {
      formatLiquidationPoints()
    }
  }, [liquidationPoints])

  const resetConditions = () => {
    setResetFlag(!resetFlag)
  }

  const refreshData = () => {
    setRefresh(!refresh)
  }

  const closePosition = () => {
    setClosing(true)
    close(contracts, id).then((hash)=>{
      setClosing(false)
      successModal("Withdrawal Successful", 
        <Text>
          Assets were withdrawn successfully, 
          View <a href={getBlockExplorerUrlTransaction(chainId, hash)} target="_blank" rel="noopener noreferrer"><Text as='u' textColor={'blue.500'}>transaction</Text></a>
          &nbsp;on block explorer.
        </Text>
      )
      onCloseClose()
    }).catch((error)=>{
      setClosing(false)
      onError(error)
    })
  }

  const updateConditions = async () => {
    setAdjusting(true)
    if (wrongUser) {
      setError(`Wrong wallet address connected`)
      openError()
      setAdjusting(false)
      return
    }
    let invalidConditions = false
    const formattedConditions: LiquidationConditionStruct[] = liquidationConditions.map((condition, index) => {
      try {
        return {
          watchedToken: condition.watchedAsset.contract_address,
          liquidateTo: condition.convertTo.contract_address,
          lessThan: condition.lessThan,
          liquidationPoint: ethers.utils.parseUnits(condition.liquidationPoint.toString(), 18),
          slippage: ethers.utils.parseUnits((condition.slippage/100).toString(), 18)
        }
      } catch (error) {
        console.log(error)
        invalidConditions = true
        setError(`Invalid data for liquidation condition ${index+1}`)
      }
    })
    if (invalidConditions) {
      openError()
      setAdjusting(false)
      return
    }
    const assetToConvert = [{ ...defaultUserAssetSupplied,
      contract_address: position.tokenContract,
      contract_decimals: position.decimals,
      tokensSupplied: position?.formattedAmount
    }]
    // @ts-ignore
    for (const [index, condition] of liquidationConditions.entries()) {
      const desiredAsset = [{
        ...defaultWantedAsset,
        contract_address: condition.convertTo.contract_address,
        percentage: 100,
        minOut: 0,
        contract_decimals: condition.convertTo.contract_decimals
      }]
      const {expectedAssets} = await getAmountsOut(contracts, signer, assetToConvert, desiredAsset)
      const expectedUsdOut = expectedAssets[0].quote
      const slippage = 100*(+position.usdcValue-expectedUsdOut)/+position.usdcValue
      if (+slippage+0.2>+condition.slippage) {
        setError(`Calculated slippage for condition ${index+1} was ${slippage.toFixed(3)}% which is too close to the input slippage.
        Please increase the slippage tolerance to ${(+slippage+0.2).toFixed(2)}% or greater`)
        openError()
        setAdjusting(false)
        return
      }
    }
    adjustLiquidationPoints(contracts, id, formattedConditions).then((hash) => {
      setAdjusting(false)
      successModal("Update Successful", 
        <Text>
          Liquidation conditions updated, 
          View <a href={getBlockExplorerUrlTransaction(chainId, hash)} target="_blank" rel="noopener noreferrer"><Text as='u' textColor={'blue.500'}>transaction</Text></a>
          &nbsp;on block explorer.
        </Text>
      )
      refreshData()
    }).catch((error)=>{
      setAdjusting(false)
      onError(error)
    })
  }

  return (
    <Box maxWidth={'700px'} marginTop='50px' marginInline={'auto'}>
    <Box
      bg={useColorModeValue(...level1)}
      boxShadow={'2xl'}
      rounded={'lg'}
      p={{base:4, md: 8}}>
        <Flex mb={'3'}>
          <PrimaryButton disabled={wrongUser} size={'large'} mr={'4'} onClick={onDepositOpen}>Deposit</PrimaryButton>
          <SecondaryButton disabled={wrongUser} size={'large'} onClick={onWithdrawOpen}>Withdraw</SecondaryButton>
          <Box marginLeft={'auto'}>
            <DangerButton disabled={wrongUser} size={'large'} onClick={onCloseOpen}>Close</DangerButton>
          </Box>
        </Flex>
        <Grid
          w={'100%'}
          gridTemplateRows={'1fr 1fr'}
          templateColumns={{base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)'}}
          mb={'8'}
          mt={'4'}
          gap={2}
        >
        <GridItem colSpan={1}>
          <Heading2>Asset</Heading2>
          <Text>{position?.name}</Text>
        </GridItem>
        <GridItem colSpan={1}>
          <Box>
          <Heading2>Underlying Tokens</Heading2>
          {
            position?.underlying.map((underlyingAsset)=> <Text>{underlyingAsset.name}</Text>)
          }
          </Box>
        </GridItem>
        <GridItem rowStart={2} colSpan={1}>
          <Heading2>Position Size</Heading2>
          <Text>{nFormatter(position?.formattedAmount||0, 3)}</Text>
        </GridItem>
        <GridItem rowStart={2} colSpan={1}>
          <Heading2>Value USD</Heading2>
          <Text fontSize='l'>${nFormatter(position?.usdcValue, 3)}</Text>
        </GridItem>
      </Grid>
      <Heading2>Liquidation Conditions</Heading2>
      <Flex margin={'auto'} marginTop={{base:'0px', sm: '-40px'}}>
        <LiquidationConditions
        assetPrice={position?.usdcValue} initialLiquidationPoints={initialLiquidationPoints}
        liquidationPoints={liquidationConditions} onChangeConditions={setLiquidationConditions} resetFlag={resetFlag}
        onReload={()=>setReloadTrigger(!reloadTrigger)} loading={loading}/>
      </Flex>
      <Flex mt={'4'} justifyContent={'center'}>
        <PrimaryButton disabled={wrongUser} isLoading={isAdjusting} mr={'4'} onClick={updateConditions}>Update Conditions</PrimaryButton>
        <SecondaryButton rounded={'full'} onClick={resetConditions}>Reset Conditions</SecondaryButton>
      </Flex>
    </Box>
    <Modal isCentered size={'md'} isOpen={isDepositOpen} onClose={onDepositClose}>
      <ModalOverlay
        bg='blackAlpha.300'
        backdropFilter='blur(10px)'
      />
      <ModalContent bgColor={useColorModeValue('white', 'gray.900')} paddingBlock={'5'} margin={'3'}>
        <ModalHeader paddingBlock={'0'}>Deposit</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <DepositModal position={position} closeSelf={onDepositClose} refreshData={refreshData}></DepositModal>
        </ModalBody>
      </ModalContent>
    </Modal>
    <Modal isCentered isOpen={isWithdrawOpen} onClose={onWithdrawClose} size='sm'>
      <ModalOverlay
        bg='blackAlpha.300'
        backdropFilter='blur(10px)'
      />
      <ModalContent bgColor={useColorModeValue('white', 'gray.900')} paddingBlock={'5'}>
        <ModalHeader>Withdraw</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <WithdrawModal position={position} closeSelf={onWithdrawClose} refreshData={refreshData}/>
        </ModalBody>
      </ModalContent>
    </Modal>
    <Modal isCentered isOpen={isCloseOpen} onClose={onCloseClose}>
      <ModalOverlay
        bg='blackAlpha.300'
        backdropFilter='blur(10px)'
      />
      <ModalContent padding={'5'}>
        <ModalHeader>Close Position</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={'10'}>Are you sure you want to close the position?</Text>
          <Flex justifyContent={'end'}>
          <DangerButton isLoading={isClosing} mr={'5'} size='large' onClick={closePosition}>Confirm</DangerButton>
          <PrimaryButton loadingText={'Closing'} size='large' onClick={onCloseClose}>Cancel</PrimaryButton>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
      <Modal size={'sm'} isCentered isOpen={errorOpen} onClose={closeError}>
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
    </Box>
  )
}
 
export default EditPosition