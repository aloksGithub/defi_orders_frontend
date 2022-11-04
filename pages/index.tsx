import { useAppContext } from "../components/Provider"
import {
  Text,
  Button,
  Flex,
  Box,
  Grid,
  GridItem,
  Select as DefaultSelect,
  NumberInput,
  NumberInputField,
  useDisclosure,
  ModalBody,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Heading,
  Stack,
  useColorModeValue,
  ModalFooter,
} from '@chakra-ui/react'
import { useEffect, useState, useRef } from "react"
import { ArrowBackIcon } from "@chakra-ui/icons"
import { ethers } from "ethers";
import erc20Abi from "../constants/abis/ERC20.json"
import bankAbi from "../constants/abis/BankBase.json"
import { useWeb3React } from "@web3-react/core";
import { depositNew } from "../contractCalls/transactions";
import LiquidationConditions from "../components/LiquidationConditions";
import { useRouter } from "next/router";
import { Pagination } from "../components/Pagination";
import { Heading2 } from "../components/Typography";
import { getBlockExplorerUrl, nFormatter } from "../utils";
import { BiErrorAlt } from "react-icons/bi"

const Card = ({asset, index, setSecuring}) => {
  const {chainId} = useAppContext()

  return (
    <Box _hover={{transform: 'scale(1.05)'}} margin={'6'} minW={'300px'} sx={{'transition': '0.4s'}}>
      <Flex _hover={{backgroundColor: '#f5f5f5'}} direction={'column'}
        justifyContent={'space-between'}
        h={'100%'}
        w={'full'}
        bg={useColorModeValue('white', 'gray.900')}
        boxShadow={'2xl'}
        rounded={'lg'}
        p={6}
        textAlign={'center'}>
        <Flex mb={'3'} pb={'3'} justifyContent={'center'} alignItems={'center'}>
        <img src={asset.logo_url} style={{width: "30px", height: "30px"}}/>
        <a href={getBlockExplorerUrl(chainId, asset.contract_address)} target="_blank" rel="noopener noreferrer">
        <Heading _hover={{color: 'blue.500'}} ml={'3'} fontSize={'xl'}>
        {asset.contract_ticker_symbol}
        </Heading>
        </a>
        </Flex>
        <Flex justifyContent={'space-between'}>
          <Box>
          <Flex mb={'3'} flexDir={'column'} alignItems={'start'}>
            <Text as='b'>
              Balance
            </Text>
            {nFormatter((asset.balance/10**asset.contract_decimals), 3)}
          </Flex>
          <Flex mb={'3'} flexDir={'column'} alignItems={'start'}>
            <Text as='b'>
            USD Value
            </Text>
            ${nFormatter(asset.quote, 2)}
          </Flex>
          </Box>
          {
            asset.underlying.length>0?
            <Box>
              <Text textAlign={'start'} as='b'>Underlying</Text>
              {
                asset.underlying.map(token=> {
                  return (
                    <Flex alignItems={'center'} paddingBlock={'1'} marginBlock={'1'} >
                      <img src={token.logo_url} style={{width: "20px", height: "20px", borderRadius: '15px'}}/>
                      <a href={getBlockExplorerUrl(chainId, token.address)} target="_blank" rel="noopener noreferrer">
                      <Text _hover={{color: 'blue.500', cursor: 'pointer'}} display={'flex'} alignItems={'center'} ml={'2'} mr={'1'}>
                        {token.symbol}
                      </Text>
                      </a>
                    </Flex>
                  )
                })
              }
            </Box>:<></>
          }
        </Flex>

        <Stack margin={'auto'} width={'60%'} mt={8} direction={'row'} spacing={4}>
        <Button
          onClick={()=>setSecuring(index)}
          flex={1}
          fontSize={'sm'}
          rounded={'full'}
          bg={'blue.400'}
          color={'white'}
          boxShadow={
            '0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)'
          }
          _hover={{
            bg: 'blue.500',
          }}
          _focus={{
            bg: 'blue.500',
          }}>
          Open Position
        </Button>
        </Stack>
      </Flex>
    </Box>
  )
}

const SecureAsset = ({asset, setSecuring}) => {
  const childStateRef = useRef()
  const {account, contracts, onError} = useAppContext()
  const {provider, chainId} = useWeb3React()
  const signer = provider.getSigner(account)
  const [tokens, setTokens] = useState(0)
  const [banks, setBanks] = useState([])
  const [selectedBank, selectBank] = useState(undefined)
  const [rewards, setRewards] = useState([])
  const [error, setError] = useState("")
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentUsd, setCurrentUsd] = useState('0')
  const [processing, setProcessing] = useState(false)
  const [liquidationConditions, setLiquidationConditions] = useState([{
    watchedAsset: {
      "value": "0x0000000000000000000000000000000000000000",
      "label": "Value of self",
      "contract_name": "Value of self",
      "contract_ticker_symbol": "Self",
      "contract_address": "0x0000000000000000000000000000000000000000",
      "underlying": [],
      "logo_url": "https://www.svgrepo.com/show/99387/dollar.svg"
    },
    convertTo: undefined,
    lessThan: false,
    liquidationPoint: 0
  }])
  const router = useRouter()

  useEffect(() => {
    setCurrentUsd((asset.quote*tokens/(asset.balance/10**asset.contract_decimals)||0).toFixed(3))
  }, [tokens])

  useEffect(() => {
    const getBanks = async () => {
      if (!contracts.positionManager) {
        return
      }
      const [bankIds, bankNames, tokenIds] = await contracts.positionManager.functions.recommendBank(asset.contract_address)
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
      const bankAddress = await contracts.positionManager.functions.banks(selectedBank)
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
    setSecuring(undefined)
    setTokens(0)
  }

  const secure = async () => {
    setProcessing(true)
    let invalidConditions = false
    const formattedConditions = liquidationConditions.map((condition, index) => {
      try {
        return {
          watchedToken: condition.watchedAsset.contract_address,
          liquidateTo: condition.convertTo.contract_address,
          lessThan: condition.lessThan,
          liquidationPoint: condition.liquidationPoint
        }
      } catch {
        invalidConditions = true
        setError(`Invalid data for liquidation condition ${index+1}`)
      }
    })
    if (invalidConditions) {
      onOpen()
      setProcessing(false)
      return
    }
    const bank = banks.find(bank=>bank.value.toString()===selectedBank)
    if (!bank) {
      setError(`Bank is not specified`)
      onOpen()
      setProcessing(false)
      return
    }
    if (!tokens) {
      setError(`Deposit amount not specified`)
      onOpen()
      setProcessing(false)
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
    depositNew(contracts, signer, position, asset).then(() => {
      setTimeout(() => {
        setProcessing(false)
        ethers.getDefaultProvider().getBlockNumber()
        router.push("/Positions")
      }, 10000);
    }).catch((error)=>{
      setProcessing(false)
      onError(error)
      console.log("Transaction failed", error)
    })
  }

  return (
    <Box
    justifyContent={'space-between'}
    bg={useColorModeValue('white', 'gray.900')}
    boxShadow={'2xl'}
    rounded={'lg'}
    p={{base:4, md: 8}}>
      <Grid
        w={'100%'}
        gridTemplateRows={'30px 1fr 1fr'}
        // templateRows='repeat(3, 1fr)'
        templateColumns={{base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)'}}
        mb={'8'}
        gap={10}
      >
        <GridItem colSpan={{base:1, md: 2}}>
        <Heading2>Secure {asset.contract_name}</Heading2>
        </GridItem>
        <GridItem colStart={{base: 2, md: 3}} colSpan={1} display='flex' justifyContent={'end'}>
        <Button onClick={exitSecuring} alignSelf={'start'} marginBottom={3}><ArrowBackIcon/>Back</Button>
        </GridItem>
        <GridItem rowStart={2} colSpan={1}>
          <Heading2>Bank</Heading2>
          <DefaultSelect size={'sm'} w={'60%'} placeholder='Select Bank' onChange={(event)=>selectBank(event.target.value)}>
            {
              banks.map(bank=> (<option value={bank.value}>{bank.label}</option>))
            }
          </DefaultSelect>
        </GridItem>
        <GridItem rowStart={2} colSpan={1}>
          <Heading2>Expected Rewards</Heading2>
          { rewards.length>0?
            rewards.map(reward=> <Text fontSize='l'>{reward}</Text>):
            <Text fontSize='l'>None</Text>
          }
        </GridItem>
        <GridItem rowStart={3} colSpan={1}>
          <Heading2>Tokens To Secure</Heading2>
          <NumberInput size={'sm'} w={'60%'} min={0} max={asset.balance/10**asset.contract_decimals}
          onChange={(valueString)=>setTokens(parseFloat(valueString))}>
            <NumberInputField backgroundColor={'white'}></NumberInputField>
          </NumberInput>
        </GridItem>
        <GridItem rowStart={3} colSpan={1}>
          <Heading2>Secured USD</Heading2>
          <Text fontSize='l'>${currentUsd}</Text>
        </GridItem>
      </Grid>
      <Heading2>Liquidation Conditions</Heading2>
      <Flex maxWidth={'500px'} margin={'auto'} marginTop={'-40px'}>
        <LiquidationConditions
        liquidationPoints = {liquidationConditions}
        onChangeConditions={setLiquidationConditions} resetFlag={undefined} assetPrice={currentUsd}></LiquidationConditions>
      </Flex>
      <Flex marginBlock={'10'} justifyContent={'center'}>
      <Button height={'20'} bgGradient='linear(to-l, #822bd9, #3db0f2)' width={'70%'} maxWidth={'300px'}
      justifyContent={'center'} alignItems={'center'} borderRadius={'2xl'} boxShadow={'dark-lg'}
      _hover={{cursor: 'pointer', bgGradient: 'linear(to-l, #6823ad, #3db0f2)'}}
      onClick={secure}>
        <Text fontSize={'3xl'} color={'white'}>Secure</Text>
      </Button>
      </Flex>
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
    </Box>
  )
}

const Assets = () => {
  const {userAssets, supportedAssets} = useAppContext()
  const {data:assets, loading, error} = userAssets
  const [securing, setSecuring] = useState<number>()

  return (
    <Flex justifyContent={'center'}>
      {
        securing!=undefined?
        <SecureAsset asset={assets[securing]} setSecuring={setSecuring} />:        
        <Flex direction={'column'} justifyContent={'center'}>
          <Pagination
          cards={assets?.map((asset, index)=><Card asset={asset} index={index} setSecuring={setSecuring}></Card>)}
          placeholder={<Text mt={'20'}>{!('ERC20' in supportedAssets)?'Website still deploying, try reloading in a minute':'No Assets detected'}</Text>}
          loading={loading}></Pagination>
          <Flex wrap={'wrap'} justifyContent={'center'} alignContent={'stretch'} maxW={'1000px'}>
          </Flex>
        </Flex>
      }
      
    </Flex>
  )
}

export default Assets