import { useAppContext } from "../../components/Provider"
import { Box, Flex, Text, Button, Grid, GridItem, NumberInput, NumberInputField, useDisclosure, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Slider, SliderFilledTrack, SliderThumb, SliderTrack, useColorModeValue } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/router'
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import erc20Abi from "../../constants/abis/ERC20.json"
import { fetchPosition } from "../../contractCalls/dataFetching";
import { depositAgain, close, harvest, compound, withdraw, adjustLiquidationPoints } from "../../contractCalls/transactions";
import LiquidationConditions from "../../components/LiquidationConditions";
import { SupplyAssets } from "../../components/selectAssets";
 
const WithdrawModal = ({position, refreshData, closeSelf}) => {
  const positionSize = position?.positionData.amount.toString()||0
  const {contracts} = useAppContext()
  const [value, setValue] = useState('0')
  const [isWithdrawing, setWithdrawing] = useState(false)
  const [percentage, setPercentage] = useState(0)
  const max = ethers.BigNumber.from(positionSize)
  console.log(value, position.usdcValue, max)
  const usdWithdraw = ethers.BigNumber.from(value).mul(10000).div(max).toNumber()*position.usdcValue/10000
  console.log(ethers.BigNumber.from(value).div(max).toNumber())
  const handleChange = (value) => {
    setValue(value)
    setPercentage(ethers.BigNumber.from(value).mul('100').div(max).toNumber())
  }
  const hangleChangeSlider = (value) => {
    setPercentage(value)
    setValue(max.mul(value).div('100').toString())
  }
  const withdrawFromPostion = () => {
    setWithdrawing(true)
    withdraw(contracts, position.positionId, value).then(()=>{
      setTimeout(() => {
        setWithdrawing(false)
        ethers.getDefaultProvider().getBlockNumber()
        refreshData()
        closeSelf()
      }, 6000);
    }).catch(()=>{
      setWithdrawing(false)
      console.log("Transaction failed")
    })
  }
  return (
    <Box>
      <Flex mb={'4'}>
      <Text as={'b'} mr={'4'}>Available Tokens:</Text>
      <Text>{positionSize}</Text>
      </Flex>
      <Flex mb={'4'}>
      <Text as={'b'} mr={'4'}>Expected withdrawal worth:</Text>
      <Text>${usdWithdraw.toFixed(4)}</Text>
      </Flex>
      <Box mb={'4'}>
      <Text as={'b'}>Tokens to Withdraw:</Text>
      <Flex>
      <NumberInput width={'50%'} mt={'2'} max={positionSize.toString()} mr='2rem' value={value} onChange={handleChange}>
        <NumberInputField />
      </NumberInput>
      <Slider
        flex='1'
        focusThumbOnChange={false}
        value={percentage}
        max={100}
        onChange={hangleChangeSlider}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb fontSize='sm' boxSize='32px' children={percentage} />
      </Slider>
      </Flex>
      </Box>
      <Flex justifyContent={'center'}>
      <Button isLoading={isWithdrawing} colorScheme={'blue'} margin={'auto'} onClick={withdrawFromPostion}>Withdraw</Button>
      </Flex>
    </Box>
  )
}

const DepositModal = ({position, refreshData, closeSelf}) => {
  const childStateRef = useRef()
  const {contracts, chainId, slippageControl: {slippage}} = useAppContext()
  const {provider ,account} = useWeb3React()
  const [isDepositing, setDepositing] = useState(false)
  
  const supply = async () => {
    setDepositing(true)
    // @ts-ignore
    const assetsToConvert = childStateRef.current.getFormattedConditions()
    depositAgain(contracts,provider.getSigner(account), position, assetsToConvert, chainId, slippage).then(()=>{
      setTimeout(() => {
        setDepositing(false)
        ethers.getDefaultProvider().getBlockNumber()
        refreshData()
        closeSelf()
      }, 10000);
    }).catch(()=>{
      setDepositing(false)
      console.log("Transaction failed")
    })
  }

  return (
    <Flex alignItems={'center'} direction={'column'} maxH={'50vh'}>
      <Box >
        <SupplyAssets ref={childStateRef}/>
        <Flex justifyContent={'center'}><Button isLoading={isDepositing} colorScheme={'blue'} mt={'8'} onClick={supply}>Deposit</Button></Flex>
      </Box>
    </Flex>
  )
}

const EditPosition = () => {
  const childStateRef = useRef()
  const {contracts, chainId, supportedAssets} = useAppContext()
  const {provider, account} = useWeb3React()
  const router = useRouter()
  const { id } = router.query
  // const position = userPositions?.find((position)=>position.positionId.toString()===id)
  const [position, setPosition] = useState(undefined)
  const [rewards, setRewards] = useState([])
  const [initialLiquidationPoints, setInitialLiquidationPoints] = useState([])
  const [isClosing, setClosing] = useState(false)
  const [isHarvesting, setHarvesting] = useState(false)
  const [isCompounding, setCompounding] = useState(false)
  const [isAdjusting, setAdjusting] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const { isOpen: isDepositOpen, onOpen: onDepositOpen, onClose: onDepositClose } = useDisclosure();
  const { isOpen: isWithdrawOpen, onOpen: onWithdrawOpen, onClose: onWithdrawClose } = useDisclosure();
  const { isOpen: isCloseOpen, onOpen: onCloseOpen, onClose: onCloseClose } = useDisclosure();
  const [resetFlag, setResetFlag] = useState(false)
  // @ts-ignore
  const liquidationPoints = position?.positionData.liquidationPoints
  console.log(position?.positionData)

  useEffect(() => {
    const fetch = async () => {
      // @ts-ignore
      const position = await fetchPosition(parseInt(id), contracts, provider.getSigner(account))
      setPosition(position)
    }
    console.log("Should refresh data")
    if (contracts && provider) {
      fetch()
    }
  }, [contracts, provider, id, refresh])

  useEffect(() => {
    const formatLiquidationPoints = async () => {
      const formattedLiquidationPoints = []
      const addedIndices = []
      for (const [index, point] of liquidationPoints.entries()) {
        if (addedIndices.includes(index)) {
          continue
        }
        const secondPointIndex = liquidationPoints.findIndex(point2=>point2.watchedToken===point.watchedToken && point.lessThan!=point2.lessThan)
        let secondPoint
        if (secondPointIndex!=-1) {
          addedIndices.push(secondPointIndex)
          secondPoint = liquidationPoints[secondPointIndex]
        }
        let above, below
        if (point.lessThan) {
          below = point?.liquidationPoint?ethers.utils.formatUnits(point.liquidationPoint.toString(), '18').toString():undefined
          above = secondPoint?.liquidationPoint?ethers.utils.formatUnits(secondPoint?.liquidationPoint.toString()||'0', '18').toString():undefined
        } else {
          above = point?.liquidationPoint?ethers.utils.formatUnits(point.liquidationPoint.toString()||'0', '18').toString():undefined
          below = secondPoint?.liquidationPoint?ethers.utils.formatUnits(secondPoint?.liquidationPoint.toString()||'0', '18').toString():undefined
        }
        // const below = point.lessThan?ethers.utils.formatUnits(point.liquidationPoint.toString()||'0', '18').toString():ethers.utils.formatUnits(secondPoint?.liquidationPoint.toString()||'0', '18').toString()
        // const above = !point.lessThan?ethers.utils.formatUnits(point.liquidationPoint.toString()||'0', '18').toString():ethers.utils.formatUnits(secondPoint?.liquidationPoint.toString()||'0', '18').toString()
        let price
        if (point.watchedToken===ethers.constants.AddressZero) {
          price = position.usdcValue
        } else {
          const {data: {price:priceValue}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${point.watchedToken}`)).json()
          price = priceValue
        }
        formattedLiquidationPoints.push({watchedToken: point.watchedToken, above, below, liquidateTo: point.liquidateTo, price})
        
      }
      setInitialLiquidationPoints(JSON.parse(JSON.stringify(formattedLiquidationPoints)))
    }
    if (liquidationPoints) {
      formatLiquidationPoints()
    }
  }, [liquidationPoints])

  useEffect(() => {
    const fetchRewards = async () => {
      const {rewards, rewardAmounts} = await contracts?.positionManager.callStatic.harvestRewards(id)
      const formattedRewards = await Promise.all(rewards.map(async (reward, index)=> {
        const contract = new ethers.Contract(reward, erc20Abi, provider)
        const decimals = await contract.decimals()
        const name = await contract.name()  
        const rewardAmount = rewardAmounts[index].div(ethers.utils.parseUnits("1.0", decimals)).toNumber()
        return ({name, rewardAmount})
      }))
      setRewards(formattedRewards)
    }
    if (contracts) {
      fetchRewards()
    }
  }, [provider])

  const resetConditions = () => {
    setResetFlag(!resetFlag)
  }

  const refreshData = () => {
    setRefresh(!refresh)
  }

  const closePosition = () => {
    setClosing(true)
    close(contracts, id).then(()=>{
      setClosing(false)
      router.push("/Positions")
    }).catch(()=>{
      setClosing(false)
      console.log("Transaction failed")
    })
  }

  const harvestPosition = () => {
    setHarvesting(true)
    harvest(contracts, id).then(()=>{
      setHarvesting(false)
      refreshData()
    }).catch(()=>{
      setHarvesting(false)
      console.log("Transaction failed")
    })
  }

  const compoundPosition = () => {
    setCompounding(true)
    compound(contracts, id).then(()=>{
      setCompounding(false)
      refreshData()
    }).catch(()=>{
      setCompounding(false)
      console.log("Transaction failed")
    })
  }

  const updateConditions = () => {
    setAdjusting(true)
    // @ts-ignore
    let formattedConditions = childStateRef.current.getFormattedConditions()
    adjustLiquidationPoints(contracts, id, formattedConditions).then(() => {
      setTimeout(() => {
        setAdjusting(false)
        ethers.getDefaultProvider().getBlockNumber()
        refreshData()
      }, 10000);
    }).catch(()=>{
      setAdjusting(false)
      console.log("Transaction failed")
    })
  }

  return (
    <Flex marginTop={10} marginBottom={10} justifyContent={'center'}>
    <Box
      justifyContent={'space-between'}
      bg={useColorModeValue('white', 'gray.900')}
      boxShadow={'2xl'}
      rounded={'lg'}
      p={10}>
      <Grid
        w={'100%'}
        gridTemplateRows={'30px 1fr 1fr'}
        // templateRows='repeat(3, 1fr)'
        templateColumns='repeat(3, 1fr)'
        mb={'8'}
        gap={10}
      >
        <GridItem colSpan={2}>
        <Button colorScheme='blue' rounded={'full'} mr={'4'} size='lg' onClick={onDepositOpen}>Deposit</Button>
        <Button rounded={'full'} size='lg' onClick={onWithdrawOpen}>Withdraw</Button>
        </GridItem>
        <GridItem colStart={3} colSpan={1} display='flex' justifyContent={'end'}>
        <Button colorScheme={'red'} rounded={'full'} size='lg' onClick={onCloseOpen}>Close</Button>
        </GridItem>
        <GridItem colSpan={1}>
          <Text fontSize='xl' as={'b'}>Asset</Text>
          <Text>{position?.name}</Text>
        </GridItem>
        <GridItem colSpan={1}>
          <Text fontSize='xl' as={'b'}>Underlying Tokens</Text>
          {
            position?.underlying.map((token)=> <Text>{token}</Text>)
          }
        </GridItem>
        <GridItem rowStart={3} colSpan={1}>
          <Text fontSize='xl' as={'b'}>Position Size</Text>
          <Text>{position?.positionData.amount.toString()||0}</Text>
        </GridItem>
        <GridItem rowStart={3} colSpan={1}>
          <Text fontSize='xl' as={'b'}>Value USD</Text>
          <Text fontSize='l'>${position?.usdcValue.toFixed(4)}</Text>
        </GridItem>
        <GridItem rowStart={3} colSpan={1}>
          <>
          <Text fontSize='xl' as={'b'}>Rewards</Text>
          {
            rewards.length>0?
            rewards.map((reward) => {
              return (
                <Flex mb={'3'}>
                  <Text mr={'2'}>{reward.name}:</Text>
                  <Text>{reward.rewardAmount}</Text>
                </Flex>
              )
            }):<Text>None</Text>
          }
          {
            rewards.length>0?
            
            <Flex>
            <Button mr={'3'} isLoading={isHarvesting} colorScheme={'blue'} maxW={'100'} size={'sm'} onClick={harvestPosition}>Harvest</Button>
            <Button isLoading={isCompounding} colorScheme={'blue'} maxW={'100'} size={'sm'} onClick={compoundPosition}>Compound</Button>
            </Flex>:<></>
          }
          </>
        </GridItem>
      </Grid>
      <Text fontSize='xl' as={'b'}>Liquidation Conditions</Text>
      {/* @ts-ignore */}
      <LiquidationConditions assetPrice={position?.usdcValue} initialLiquidationPoints={initialLiquidationPoints} resetFlag={resetFlag} ref={childStateRef}></LiquidationConditions>
      <Flex mt={'4'} justifyContent={'center'}>
        <Button colorScheme='blue' isLoading={isAdjusting} rounded={'full'} mr={'4'} onClick={updateConditions}>Update Conditions</Button>
        <Button rounded={'full'} onClick={resetConditions}>Reset Conditions</Button>
      </Flex>
    </Box>
    <Modal isCentered size={'3xl'} isOpen={isDepositOpen} onClose={onDepositClose}>
      <ModalOverlay
        bg='blackAlpha.300'
        backdropFilter='blur(10px)'
      />
      <ModalContent padding={'5'}>
        <ModalHeader>Deposit</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <DepositModal position={position} closeSelf={onDepositClose} refreshData={refreshData}></DepositModal>
        </ModalBody>
      </ModalContent>
    </Modal>
    <Modal isCentered isOpen={isWithdrawOpen} onClose={onWithdrawClose}>
      <ModalOverlay
        bg='blackAlpha.300'
        backdropFilter='blur(10px)'
      />
      <ModalContent padding={'5'}>
        <ModalHeader>Withdraw</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <WithdrawModal position={position} closeSelf={onWithdrawClose} refreshData={refreshData}></WithdrawModal>
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
          <Button colorScheme={'red'} isLoading={isClosing} mr={'5'} rounded={'full'} size='lg' onClick={closePosition}>Confirm</Button>
          <Button colorScheme={'blue'} loadingText={'Closing'} rounded={'full'} size='lg' onClick={onCloseClose}>Cancel</Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
    </Flex>
  )
}

export default EditPosition