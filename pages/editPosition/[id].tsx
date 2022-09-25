import { useAppContext } from "../../components/Provider"
import { Box, Flex, Table, TableContainer, Tbody, Th, Thead, Tr, Text, Td, Button, Grid, GridItem, NumberInput, NumberInputField, useDisclosure, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Slider, SliderFilledTrack, SliderThumb, SliderTrack, useColorModeValue } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router'
import { ArrowBackIcon, MinusIcon, AddIcon } from "@chakra-ui/icons";
import error from "next/error";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import erc20Abi from "../../constants/abis/ERC20.json"
import Select from "react-select";
import { fetchPosition } from "../../contractCalls/dataFetching";
import { depositAgain, close, harvest, compound, withdraw } from "../../contractCalls/transactions";

const WithdrawModal = ({position, refreshData, closeSelf}) => {
  const positionSize = position?.positionData.amount.toString()||0
  const {contracts} = useAppContext()
  const [value, setValue] = useState(0)
  const [isWithdrawing, setWithdrawing] = useState(false)
  const [percentage, setPercentage] = useState(0)
  const max = ethers.BigNumber.from(positionSize)
  const usdWithdraw = ethers.BigNumber.from(value).mul(position.usdcValue).div(max).toString()
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
      <Text>${usdWithdraw}</Text>
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

const DepositModal = ({position}) => {
  const {userAssets, contracts, chainId, slippage} = useAppContext()
  const {provider ,account} = useWeb3React()
  const [error, setError] = useState("")
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const filteredAssets = userAssets.filter(asset=>asset.quote>0)
  const [assetsToConvert, setAssetsToConvert] = useState<any>([{asset: undefined, tokenDecimals: undefined, tokensAvailable: undefined, usdcValue: undefined, tokensSupplied: undefined}])
  const assetOptions = filteredAssets.map(asset=>{
    return {
      value: asset.contract_address,
      label: asset.contract_name
    }
  })
  const addAsset = (i: number) => {
    setAssetsToConvert([...assetsToConvert, {asset: undefined, tokenDecimals: undefined, tokensAvailable: undefined, usdcValue: undefined, tokensSupplied: undefined}])
  }

  const removeAsset = (i: number) => {
    if (assetsToConvert.length===1) return
    const tempAssets = [...assetsToConvert]
    tempAssets.splice(i, 1)
    setAssetsToConvert(tempAssets)
  }

  const setSupply = (i:number, tokens: number) => {
    const temp = [...assetsToConvert]
    temp[i].tokensSupplied = tokens
    const assetDetails = filteredAssets.find(asset=>asset.contract_address===temp[i].asset)
    const balance = ethers.utils.formatUnits(assetDetails.balance, assetDetails.contract_decimals)
    const usdAvailable = assetDetails.quote
    const usdSupplied = (usdAvailable*tokens/balance)
    temp[i].usdcValue = usdSupplied
    setAssetsToConvert(temp)
  }

  const setAsset = (i:number, asset:string) => {
    const temp = [...assetsToConvert]
    temp[i].asset = asset
    const assetDetails = filteredAssets.find(asset=>asset.contract_address===temp[i].asset)
    const balance = ethers.utils.formatUnits(assetDetails.balance, assetDetails.contract_decimals)
    temp[i].tokensAvailable = balance
    temp[i].tokenDecimals = assetDetails.contract_decimals
    setAssetsToConvert(temp)
  }

  const supply = async () => {
    for (const asset of assetsToConvert) {
      console.log(asset)
      if (!asset.asset || !asset.tokensSupplied || !asset.usdcValue) {
        setError(`Invalid data`)
        onOpen()
        return
      }
    }
    await depositAgain(contracts, provider.getSigner(account), position, assetsToConvert, chainId, slippage)
  }

  return (
    <Flex alignItems={'center'} direction={'column'} maxH={'50vh'}>
      <Box overflowY={'scroll'}>
        <TableContainer marginTop={5} borderRadius={15}>
          <Table size='lg'>
            <Thead backgroundColor={'cyan.50'}>
              <Tr>
                <Th>Asset</Th>
                <Th>USD Supplied</Th>
                <Th>Tokens Supplied</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {
                assetsToConvert.map((asset, index) => asset?(
                  <Tr>
                    <Td>
                      <Select
                      menuPosition="fixed"
                      options={assetOptions}
                      onChange={(newValue)=>setAsset(index, newValue.value)}
                      />
                    </Td>
                    <Td>${(asset?.usdcValue || 0).toFixed(3)}</Td>
                    <Td>
                      <NumberInput maxW={32} min={0} max={asset?.tokensAvailable||99999999}
                      onChange={(valueString)=>setSupply(index, parseFloat(valueString))}>
                        <NumberInputField backgroundColor={'white'}></NumberInputField>
                      </NumberInput>
                    </Td>
                    <Td><Button onClick={()=>removeAsset(index)}><MinusIcon/></Button></Td>
                  </Tr>
                ):<></>)
              }
              <Tr>
                <Td></Td>
                <Td></Td>
                <Td></Td>
                <Td><Button onClick={addAsset}><AddIcon/></Button></Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
        <Flex justifyContent={'center'}><Button colorScheme={'blue'} mt={'8'} onClick={supply}>Deposit</Button></Flex>
      </Box>
      <Modal isCentered isOpen={isOpen} onClose={onClose}>
      <ModalOverlay
        bg='blackAlpha.300'
        backdropFilter='blur(10px)'
      />
        <ModalContent>
          <ModalHeader>Error</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>{error}</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

const EditPosition = () => {
  const {contracts, chainId, supportedAssets} = useAppContext()
  const {provider, account} = useWeb3React()
  const router = useRouter()
  const { id } = router.query
  // const position = userPositions?.find((position)=>position.positionId.toString()===id)
  const [position, setPosition] = useState(undefined)
  const [rewards, setRewards] = useState([])
  const [initialLiquidationPoints, setInitialLiquidationPoints] = useState([])
  const [newLiquidationPoints, setNewLiquidationPoints] = useState([])
  const [isClosing, setClosing] = useState(false)
  const [isHarvesting, setHarvesting] = useState(false)
  const [isCompounding, setCompounding] = useState(false)
  const [isDepositing, setDepositing] = useState(false)
  const [isWithdrawing, setWithdrawing] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const { isOpen: isDepositOpen, onOpen: onDepositOpen, onClose: onDepositClose } = useDisclosure();
  const { isOpen: isWithdrawOpen, onOpen: onWithdrawOpen, onClose: onWithdrawClose } = useDisclosure();
  const { isOpen: isCloseOpen, onOpen: onCloseOpen, onClose: onCloseClose } = useDisclosure();
  const assetsArray = supportedAssets.ERC20
  const liquidationPoints = position?.positionData.liquidationPoints

  console.log(refresh)

  useEffect(() => {
    const fetch = async () => {
      const position = await fetchPosition(parseInt(id), contracts, provider.getSigner(account))
      console.log(position)
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
        const below = point.lessThan?point.liquidationPoint.toNumber():secondPoint?.liquidationPoint.toNumber()
        const above = !point.lessThan?point.liquidationPoint.toNumber():secondPoint?.liquidationPoint.toNumber()
        let price
        if (point.watchedToken===ethers.constants.AddressZero) {
          price = position.usdcValue
        } else {
          const {data: {priceValue}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${point.watchedToken}`)).json()
          price = priceValue
        }
        formattedLiquidationPoints.push({watchedToken: point.watchedToken, above, below, liquidateTo: point.liquidateTo, price})
        
      }
      setInitialLiquidationPoints(JSON.parse(JSON.stringify(formattedLiquidationPoints)))
      setNewLiquidationPoints(JSON.parse(JSON.stringify(formattedLiquidationPoints)))
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
    setNewLiquidationPoints(JSON.parse(JSON.stringify(initialLiquidationPoints)))
  }

  const addCondition = () => {
  const temp = [...newLiquidationPoints]
    temp.push({
      asset: undefined,
      below: 0, above: 0,
      liquidateTo: undefined,
      price: 0
    })
    setNewLiquidationPoints(temp)
  }

  const removeCondition = (index: number) => {
    const temp = [...newLiquidationPoints]
    temp.splice(index, 1)
    setNewLiquidationPoints(temp)
  }

  const modifyCondition = async (value, key, index) => {
    console.log(value)
    const temp = [...newLiquidationPoints]
    temp[index][key] = value || 0
    if (key==='watchedToken') {
      if (value!=ethers.constants.AddressZero) {
        const {data: {price}} = await (await fetch(`/api/tokenPrice?chainId=${chainId}&address=${value}`)).json()
        temp[index].price = price
      }
    }
    setNewLiquidationPoints(temp)
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
          <Text fontSize='l'>${position?.usdcValue}</Text>
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
        {/* <GridItem rowStart={4} colSpan={1} display={'flex'} flexDir={'column'}>
          {
            rewards.length>0?
            <>
            <Button colorScheme={'blue'} mb={'3'} maxW={'100'} size={'sm'}>Harvest</Button>
            <Button colorScheme={'blue'} maxW={'100'} size={'sm'}>Compound</Button>
            </>:<></>
          }
        </GridItem> */}
      </Grid>
      <Text fontSize='xl' as={'b'}>Liquidation Conditions</Text>
      <TableContainer marginTop={5} borderRadius={15} overflow={'hidden'}>
        <Table size='lg'>
          <Thead backgroundColor={'cyan.50'}>
            <Tr>
              <Th>Watched Asset</Th>
              <Th>Liquidation Points</Th>
              <Th>Liquidate To</Th>
              <Th>Current Value</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {
              newLiquidationPoints.map((condition, index)=> {
                return(
                <Tr>
                  <Td>
                    <Select
                      menuPosition="fixed"
                      options={[{value: ethers.constants.AddressZero, label: "Value of Position"}, ...(assetsArray||[])]}
                      value={[{value: ethers.constants.AddressZero, label: "Value of Position"}, ...(assetsArray||[])].find(asset=>asset.value===condition.watchedToken?.toLowerCase())}
                      onChange={(newValue)=>modifyCondition(newValue.value, 'watchedToken', index)}
                    />
                  </Td>
                  <Td>
                  <Flex alignItems={'center'}>
                    <Text fontSize={'xs'} mr='2'>Price above</Text>
                    <NumberInput value={condition.above} maxW={32}
                    onChange={(valueString)=>modifyCondition(valueString, 'above', index)}>
                      <NumberInputField backgroundColor={'white'}></NumberInputField>
                    </NumberInput>
                  </Flex>
                  <Flex alignItems={'center'} mt='2'>
                  <Text fontSize={'xs'} mr='2'>Price below</Text>
                    <NumberInput value={condition.below} maxW={32} min={0} max={newLiquidationPoints[index].price+0.1}
                    onChange={(valueString)=>modifyCondition(valueString, 'below', index)}>
                      <NumberInputField backgroundColor={'white'}></NumberInputField>
                    </NumberInput>
                    </Flex>
                  </Td>
                  <Td>
                    <Select
                      menuPosition="fixed"
                      options={assetsArray}
                      value={assetsArray?.find(asset=>asset.value===condition.liquidateTo?.toLowerCase())}
                      onChange={(newValue)=>modifyCondition(newValue.value, 'liquidateTo', index)}
                    />
                  </Td>
                  <Td>${newLiquidationPoints[index].watchedToken!=ethers.constants.AddressZero?newLiquidationPoints[index].price:(position.usdcValue)}</Td>
                  <Td>
                    {
                      index>0?
                      <Button onClick={()=>removeCondition(index)}><MinusIcon></MinusIcon></Button>:
                      <></>
                    }
                  </Td>
                </Tr>
              )})
            }
            <Tr>
              <Td></Td><Td></Td><Td></Td><Td></Td>
              <Td>
                <Button onClick={addCondition}>
                  <AddIcon></AddIcon>
                </Button>
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </TableContainer>
      <Flex mt={'4'} justifyContent={'center'}>
        <Button colorScheme='blue' rounded={'full'} mr={'4'}>Update Conditions</Button>
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
          <DepositModal position={position}></DepositModal>
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