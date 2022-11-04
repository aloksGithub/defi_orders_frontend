import { useAppContext } from "../../components/Provider"
import { Box, Flex, Text, Button, Grid, GridItem, NumberInput, NumberInputField, useDisclosure, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Slider, SliderFilledTrack, SliderThumb, SliderTrack, useColorModeValue, ModalFooter } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from 'next/router'
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import erc20Abi from "../../constants/abis/ERC20.json"
import { fetchPosition } from "../../contractCalls/dataFetching";
import { depositAgain, close, harvest, compound, withdraw, adjustLiquidationPoints } from "../../contractCalls/transactions";
import LiquidationConditions from "../../components/LiquidationConditions";
import { SupplyAssets } from "../../components/selectAssets";
import { Heading2 } from "../../components/Typography";
import { DangerButton, PrimaryButton, SecondaryButton } from "../../components/Buttons";
import { getPrice, nFormatter } from "../../utils";
import { BiErrorAlt } from "react-icons/bi";

const WithdrawModal = ({position, refreshData, closeSelf}) => {
  const positionSize = position?.positionData.amount.toString()||0
  const {contracts, onError} = useAppContext()
  const [value, setValue] = useState('0')
  const [isWithdrawing, setWithdrawing] = useState(false)
  const [percentage, setPercentage] = useState(0)
  const max = ethers.BigNumber.from(positionSize)
  const usdWithdraw = ethers.BigNumber.from(value).mul(10000).div(max).toNumber()*position.usdcValue/10000
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
    }).catch((error)=>{
      onError(error)
      setWithdrawing(false)
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
  const [assetsToConvert, setAssetsToConvert] = useState([])
  const {contracts, chainId, slippageControl: {slippage}, onError} = useAppContext()
  const {provider ,account} = useWeb3React()
  const [isDepositing, setDepositing] = useState(false)
  
  const supply = async () => {
    setDepositing(true)
    depositAgain(contracts,provider.getSigner(account), position, assetsToConvert, chainId, slippage).then(()=>{
      setTimeout(() => {
        setDepositing(false)
        ethers.getDefaultProvider().getBlockNumber()
        refreshData()
        closeSelf()
      }, 10000);
    }).catch((error)=>{
      setDepositing(false)
      onError(error)
    })
  }

  return (
    <Flex alignItems={'center'} direction={'column'} width={'100%'}>
      <Box width={'100%'}>
        <div style={{overflow: 'auto', maxHeight: '60vh'}}>
        <Flex width={'100%'} justifyContent={'center'}>
          <SupplyAssets onChange={setAssetsToConvert}/>
        </Flex>
        </div>
        <Flex justifyContent={'center'}><Button isLoading={isDepositing} colorScheme={'blue'} mt={'8'} onClick={supply}>Deposit</Button></Flex>
      </Box>
    </Flex>
  )
}

const EditPosition = () => {
  const {contracts, chainId, supportedAssets, onError} = useAppContext()
  const {provider, account} = useWeb3React()
  const router = useRouter()
  const { id } = router.query
  // const position = userPositions?.find((position)=>position.positionId.toString()===id)
  const [position, setPosition] = useState(undefined)
  const [initialLiquidationPoints, setInitialLiquidationPoints] = useState([])
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
  const [liquidationConditions, setLiquidationConditions] = useState<any>(undefined)

  useEffect(() => {
    const fetch = async () => {
      // @ts-ignore
      const position = await fetchPosition(parseInt(id), contracts, provider.getSigner(account))
      setPosition(position)
    }
    if (contracts && provider) {
      fetch()
    }
  }, [contracts, provider, id, refresh])

  useEffect(() => {
    const formatLiquidationPoints = async () => {
      const allAssets =  Object.values(supportedAssets).flat()
      const promises = liquidationPoints.map(async point=> {
        let watchedAsset
        let price
        if (point.watchedToken===ethers.constants.AddressZero) {
          watchedAsset = {
            value: ethers.constants.AddressZero,
            label: 'Value of self',
            contract_name: 'Value of self',
            contract_ticker_symbol: 'Self',
            contract_address: ethers.constants.AddressZero,
            underlying:[],
            logo_url: 'https://www.svgrepo.com/show/99387/dollar.svg'
          }
          price = position?.usdcValue
        } else {
          watchedAsset = allAssets.find((asset:any)=>asset.contract_address===point.watchedToken)
          price = await getPrice(chainId, point.watchedToken)
        }
        const convertTo = allAssets.find((asset:any)=>asset.contract_address===point.liquidateTo.toLowerCase())
        const lessThan = point.lessThan
        const liquidationPoint = ethers.utils.formatUnits(point.liquidationPoint.toString(), 18)
        return {watchedAsset, convertTo, lessThan, liquidationPoint, price}
      })
      const formattedLiquidationPoints = await Promise.all(promises)
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
    close(contracts, id).then(()=>{
      setClosing(false)
      router.push("/Positions")
    }).catch((error)=>{
      setClosing(false)
      onError(error)
    })
  }

  const updateConditions = () => {
    setAdjusting(true)
    let invalidConditions = false
    const formattedConditions = liquidationConditions.map((condition, index) => {
      try {
        return {
          watchedToken: condition.watchedAsset.contract_address,
          liquidateTo: condition.convertTo.contract_address,
          lessThan: condition.lessThan,
          liquidationPoint: ethers.utils.parseUnits(condition.liquidationPoint.toString(), 18)
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
    adjustLiquidationPoints(contracts, id, formattedConditions).then(() => {
      setTimeout(() => {
        setAdjusting(false)
        ethers.getDefaultProvider().getBlockNumber()
        refreshData()
      }, 10000);
    }).catch((error)=>{
      setAdjusting(false)
      onError(error)
    })
  }

  return (
    <Box maxWidth={'700px'} margin={'auto'}>
    <Box
      justifyContent={'space-between'}
      bg={useColorModeValue('white', 'gray.900')}
      boxShadow={'2xl'}
      rounded={'lg'}
      p={10}>
        <Flex>
        <PrimaryButton size={'large'} mr={'4'} onClick={onDepositOpen}>Deposit</PrimaryButton>
        <SecondaryButton size={'large'} onClick={onWithdrawOpen}>Withdraw</SecondaryButton>
        <Box marginLeft={'auto'}>
          <DangerButton size={'large'} onClick={onCloseOpen}>Close</DangerButton>
        </Box>
        </Flex>
      <Grid
        w={'100%'}
        gridTemplateRows={'1fr 1fr'}
        templateColumns={{base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)'}}
        mb={'8'}
        mt={'4'}
        gap={10}
      >
        <GridItem colSpan={1}>
          <Heading2>Asset</Heading2>
          <Text>{position?.name}</Text>
        </GridItem>
        <GridItem colSpan={1}>
          <Box>
          <Heading2>Underlying Tokens</Heading2>
          {
            position?.underlying.map((token)=> <Text>{token}</Text>)
          }
          </Box>
        </GridItem>
        <GridItem rowStart={2} colSpan={1}>
          <Heading2>Position Size</Heading2>
          <Text>{nFormatter(position?.positionData.amountDecimal||0, 3)}</Text>
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
      liquidationPoints={liquidationConditions} onChangeConditions={setLiquidationConditions} resetFlag={resetFlag}></LiquidationConditions>
      </Flex>
      <Flex mt={'4'} justifyContent={'center'}>
        <PrimaryButton isLoading={isAdjusting} mr={'4'} onClick={updateConditions}>Update Conditions</PrimaryButton>
        <SecondaryButton rounded={'full'} onClick={resetConditions}>Reset Conditions</SecondaryButton>
      </Flex>
    </Box>
    <Modal isCentered size={'md'} isOpen={isDepositOpen} onClose={onDepositClose}>
      <ModalOverlay
        bg='blackAlpha.300'
        backdropFilter='blur(10px)'
      />
      <ModalContent paddingBlock={'5'} margin={'3'}>
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