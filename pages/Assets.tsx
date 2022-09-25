import { useAppContext } from "../components/Provider"
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  Text,
  TableContainer,
  Button,
  Flex,
  Box,
  Grid,
  GridItem,
  Input,
  Select as DefaultSelect,
  NumberInput,
  NumberInputField,
  useDisclosure,
  ModalBody,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay
} from '@chakra-ui/react'
import { useEffect, useState } from "react"
import { AddIcon, ArrowBackIcon, MinusIcon } from "@chakra-ui/icons"
import {
  AsyncCreatableSelect,
  AsyncSelect,
  CreatableSelect,
  Select,
} from "chakra-react-select";
import { ethers } from "ethers";
import positionManagerAbi from "../constants/abis/PositionManager.json"
import erc20Abi from "../constants/abis/ERC20.json"
import bankAbi from "../constants/abis/BankBase.json"
import deploymentAddresses from "../constants/deployments.json"
import { useWeb3React } from "@web3-react/core";
import { depositNew } from "../contractCalls/transactions";

const SecureAsset = ({asset, setSecuring}) => {
  const {supportedAssets, account, chainId: forkedChainId, contracts} = useAppContext()
  const {provider, chainId} = useWeb3React()
  const signer = provider.getSigner(account)
  const [tokens, setTokens] = useState(0)
  const [liquidationConditions, setLiquidationConditions] = useState([{asset: undefined, below: 0, above: 0, liquidateTo: undefined, price: undefined}])
  const assetsArray = supportedAssets.ERC20
  const positionManager = new ethers.Contract(deploymentAddresses[chainId].positionsManager, positionManagerAbi, signer)
  const [banks, setBanks] = useState([])
  const [selectedBank, selectBank] = useState(undefined)
  const [rewards, setRewards] = useState([])
  const [error, setError] = useState("")
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const getBanks = async () => {
      const [bankIds, bankNames, tokenIds] = await positionManager.functions.recommendBank(asset.contract_address)
      const banks = []
      for (let [index, bank] of bankIds.entries()) {
        banks.push({
          value: bank,
          label: bankNames[index],
          tokenId: tokenIds[index]
        })
      setBanks(banks)
      }
    }
    getBanks()
  }, [])

  useEffect(() => {
    const getRewards = async () => {
      const bank = banks.find(bank=>bank.value.toString()===selectedBank)
      const bankAddress = await positionManager.functions.banks(selectedBank)
      const bankContract = new ethers.Contract(bankAddress[0], bankAbi, provider)
      const rewards = await bankContract.functions.getRewards(bank.tokenId)
      const rewardNames = []
      for (const reward of rewards.rewardsArray) {
        const contract = new ethers.Contract(reward, erc20Abi, provider)
        const name = await contract.name()
        rewardNames.push(name)
      }
      setRewards(rewardNames)
    }
    if (selectedBank) {
      getRewards()
    } else {
      setRewards([])
    }
  }, [selectedBank])

  const exitSecuring = () => {
    setLiquidationConditions([])
    setSecuring(undefined)
    setTokens(0)
  }

  const addCondition = () => {
  const temp = [...liquidationConditions]
    temp.push({
      asset: undefined,
      below: 0, above: 0,
      liquidateTo: undefined,
      price: 0
    })
    setLiquidationConditions(temp)
  }

  const removeCondition = (index: number) => {
    const temp = [...liquidationConditions]
    temp.splice(index, 1)
    setLiquidationConditions(temp)
  }

  const modifyCondition = async (value, key, index) => {
    const temp = [...liquidationConditions]
    temp[index][key] = value
    if (key==='asset') {
      if (value!=ethers.constants.AddressZero) {
        const {data: {price}} = await (await fetch(`/api/tokenPrice?chainId=${forkedChainId}&address=${value}`)).json()
        temp[index].price = price
      }
    }
    setLiquidationConditions(temp)
  }

  const secure = async () => {
    console.log(liquidationConditions)
    const formattedConditions = []
    for (let [index, condition] of liquidationConditions.entries()) {
      if (tokens===0) {
        setError(`No tokens provided`)
        onOpen()
        return
      }
      if (!condition.asset) {
        setError(`Invalid asset to watch for condition ${index}`)
        onOpen()
        return
      }
      if (!condition.liquidateTo) {
        setError(`Invalid liquidate to token for condition ${index}`)
        onOpen()
        return
      }
      if (condition.below>condition.price) {
        setError(`Lower limit for condition ${index} is greater than current price`)
        onOpen()
        return
      }
      if (condition.above<condition.price) {
        setError(`Upper limit for condition ${index} is lesser than current price`)
        onOpen()
        return
      }
      const lowerCondition = {
        wachedAsset: condition.asset,
        liquidateTo: condition.liquidateTo,
        lessThan: true,
        liquidationPoint: condition.below
      }
      const upperCondition = {
        wachedAsset: condition.asset,
        liquidateTo: condition.liquidateTo,
        lessThan: false,
        liquidationPoint: condition.above
      }
      formattedConditions.push(lowerCondition)
      formattedConditions.push(upperCondition)
    }
    const bank = banks.find(bank=>bank.value.toString()===selectedBank)
    if (!bank) {
      setError(`Bank is not specified`)
      onOpen()
      return
    }
    const position = {
      user: account,
      bankId: bank.value,
      bankToken: bank.tokenId,
      amount: ethers.utils.parseUnits(tokens.toString(), asset.contract_decimals),
      liquidationPoints: formattedConditions
    }
    console.log(position, [asset.contract_address], [ethers.utils.parseUnits(tokens.toString(), asset.contract_decimals)], [0])
    await depositNew(contracts, signer, position, asset)
  }

  return (
    <Box>
      <Grid
        w={'100%'}
        gridTemplateRows={'30px 1fr 1fr'}
        // templateRows='repeat(3, 1fr)'
        templateColumns='repeat(3, 1fr)'
        mb={'8'}
        gap={10}
      >
        <GridItem colSpan={2}>
        <Text fontSize='xl' as={'b'}>Secure {asset.contract_name}</Text>
        </GridItem>
        <GridItem colStart={3} colSpan={1} display='flex' justifyContent={'end'}>
        <Button onClick={exitSecuring} alignSelf={'start'} marginBottom={3}><ArrowBackIcon/>Back</Button>
        </GridItem>
        <GridItem colSpan={1}>
          <Text fontSize='xl' as={'b'}>Bank</Text>
          <DefaultSelect size={'sm'} w={'60%'} placeholder='Select Bank' onChange={(event)=>selectBank(event.target.value)}>
            {
              banks.map(bank=> (<option value={bank.value}>{bank.label}</option>))
            }
          </DefaultSelect>
        </GridItem>
        <GridItem colSpan={1}>
          <Text fontSize='xl' as={'b'}>Expected Rewards</Text>
          { rewards.length>0?
            rewards.map(reward=> <Text fontSize='l'>{reward}</Text>):
            <Text fontSize='l'>None</Text>
          }
        </GridItem>
        <GridItem rowStart={3} colSpan={1}>
          <Text fontSize='xl' as={'b'}>Tokens To Secure</Text>
          <NumberInput size={'sm'} w={'60%'} min={0} max={asset.balance/10**asset.contract_decimals}
          onChange={(valueString)=>setTokens(parseFloat(valueString))}>
            <NumberInputField backgroundColor={'white'}></NumberInputField>
          </NumberInput>
        </GridItem>
        <GridItem rowStart={3} colSpan={1}>
          <Text fontSize='xl' as={'b'}>Secured USD</Text>
          <Text fontSize='l'>${(asset.quote*tokens/(asset.balance/10**asset.contract_decimals)).toFixed(3)}</Text>
        </GridItem>
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
              liquidationConditions.map((condition, index)=> (
                <Tr>
                  <Td>
                    <Select
                      size="sm"
                      colorScheme="purple"
                      options={[{value: ethers.constants.AddressZero, label: "Value of Position"}, ...assetsArray]}
                      onChange={(newValue)=>modifyCondition(newValue.value, 'asset', index)}
                    />
                  </Td>
                  <Td>
                  <Flex alignItems={'center'}>
                    <Text fontSize={'xs'} mr='2'>Price above</Text>
                    <NumberInput maxW={32} min={liquidationConditions[index].price}
                    onChange={(valueString)=>modifyCondition(parseFloat(valueString), 'above', index)}>
                      <NumberInputField backgroundColor={'white'}></NumberInputField>
                    </NumberInput>
                  </Flex>
                  <Flex alignItems={'center'} mt='2'>
                  <Text fontSize={'xs'} mr='2'>Price below</Text>
                    <NumberInput maxW={32} min={0} max={liquidationConditions[index].price}
                    onChange={(valueString)=>modifyCondition(parseFloat(valueString), 'below', index)}>
                      <NumberInputField backgroundColor={'white'}></NumberInputField>
                    </NumberInput>
                    </Flex>
                  </Td>
                  <Td>
                    <Select
                      size="sm"
                      colorScheme="purple"
                      options={assetsArray}
                      onChange={(newValue)=>modifyCondition(newValue.value, 'liquidateTo', index)}
                    />
                  </Td>
                  <Td>${liquidationConditions[index].asset!=ethers.constants.AddressZero?liquidationConditions[index].price:(asset.quote*tokens/(asset.balance/10**asset.contract_decimals)).toFixed(3)}</Td>
                  <Td>
                    {
                      index>0?
                      <Button onClick={()=>removeCondition(index)}><MinusIcon></MinusIcon></Button>:
                      <></>
                    }
                  </Td>
                </Tr>
              ))
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
      <Flex mt={'10'} justifyContent={'end'}>
        <Button onClick={secure}>Secure</Button>
      </Flex>
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
    </Box>
  )
}

const Assets = () => {
  const {userAssets, account, chainId, supportedAssets} = useAppContext()
  const filteredAssets = userAssets.filter(asset=>asset.quote>0)
  const [securing, setSecuring] = useState<number>()

  return (
    <Flex marginTop={20} justifyContent={'center'}>
      {
        securing!=undefined?
        <SecureAsset asset={userAssets[securing]} setSecuring={setSecuring} />
        :
        <Box>
          <Text fontSize='xl' as={'b'}>Your Unsecured Assets</Text>
          <TableContainer marginTop={5} borderRadius={15} overflow={'hidden'}>
            <Table size='lg'>
              <Thead backgroundColor={'cyan.50'}>
                <Tr>
                  <Th>Asset</Th>
                  <Th>Worth USD</Th>
                  <Th>Balance</Th>
                  <Th>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {
                  filteredAssets.map((asset, index) => (
                    <Tr backgroundColor={index%2==0?'cyan.100':'cyan.50'}
                    _hover={{
                      backgroundColor: 'white'
                    }}>
                      <Td>
                        <Flex>
                        <img src={asset.logo_url} style={{width: 20, height: 20, marginRight: 4}}/>
                        {asset.contract_name}
                        </Flex>
                      </Td>
                      <Td>${asset.quote.toFixed(3)}</Td>
                      <Td>{(asset.balance/10**asset.contract_decimals).toFixed(3)}</Td>
                      <Td><Button onClick={()=>setSecuring(index)}>Secure</Button></Td>
                    </Tr>
                  ))
                }
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      }
      
    </Flex>
  )
}

export default Assets