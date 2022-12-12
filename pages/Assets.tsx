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
  Skeleton,
  Tooltip,
  Image,
} from '@chakra-ui/react'
import { useEffect, useState, useRef } from "react"
import { ArrowBackIcon, CheckCircleIcon } from "@chakra-ui/icons"
import { ethers } from "ethers";
import erc20Abi from "../constants/abis/ERC20.json"
import bankAbi from "../constants/abis/BankBase.json"
import { useWeb3React } from "@web3-react/core";
import { depositNew } from "../contractCalls/transactions";
import LiquidationConditions from "../components/LiquidationConditions";
import { useRouter } from "next/router";
import { Pagination } from "../components/Pagination";
import { Heading2 } from "../components/Typography";
import { getBlockExplorerUrl, getBlockExplorerUrlTransaction, nFormatter } from "../utils";
import { BiErrorAlt } from "react-icons/bi"
import { FancyButton } from "../components/Buttons";
import Link from "next/link";
import { level1 } from "../components/Theme";
import { getAmountsOut } from "../contractCalls/dataFetching";

const Card = ({asset, index, setSecuring}) => {
  const {chainId} = useAppContext()

  return (
    <Box width={'300px'} margin={'auto'}>
      <Flex direction={'column'}
        justifyContent={'space-between'}
        h={'100%'}
        w={'full'}
        bg={useColorModeValue(...level1)}
        boxShadow={'2xl'}
        rounded={'lg'}
        p={6}
        textAlign={'center'}>
        <Flex mb={'3'} pb={'3'} justifyContent={'center'} alignItems={'center'}>
        <Image src={asset.logo_url} fallbackSrc='https://www.svgrepo.com/show/99387/dollar.svg' style={{width: "30px", height: "30px"}}/>
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
                      <a href={getBlockExplorerUrl(chainId, token.contract_address)} target="_blank" rel="noopener noreferrer">
                      <Text _hover={{color: 'blue.500', cursor: 'pointer'}} display={'flex'} alignItems={'center'} ml={'2'} mr={'1'}>
                        {token.contract_symbol}
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
          rounded={'full'}
          bg={useColorModeValue('blue.400', 'blue.600')}
          color={'white'}
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
  const {account, contracts, onError, userAssets: {loading, data}, softRefreshAssets, chainId, slippageControl: {slippage}} = useAppContext()
  const {provider} = useWeb3React()
  const signer = provider.getSigner(account)
  const [tokens, setTokens] = useState(0)
  const [selectedBank, selectBank] = useState(undefined)
  const [rewards, setRewards] = useState([])
  const [error, setError] = useState("")
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isOpenSuceess, onOpen: onOpenSuccess, onClose: onCloseSuccess } = useDisclosure();
  const [currentUsd, setCurrentUsd] = useState('0')
  const [txHash, setTxHash] = useState('')
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
    liquidationPoint: 0,
    slippage
  }])

  useEffect(() => {
    setCurrentUsd((asset?.quote*tokens/(asset?.balance/10**asset?.contract_decimals)||0).toFixed(3))
  }, [tokens])

  useEffect(() => {
    const getBanks = async () => {
      if (!contracts?.positionManager) {
        return
      }
      const [bankIds, bankNames, tokenIds] = await contracts.positionManager.recommendBank(asset.contract_address)
      selectBank({
        id: bankIds[bankIds.length-1],
        name: bankNames[bankNames.length-1],
        tokenId: tokenIds[tokenIds.length-1]
      })
    }
    getBanks()
  }, [])

  useEffect(() => {
    const getRewards = async () => {
      const bankAddress = await contracts.positionManager.functions.banks(selectedBank.id)
      const bankContract = new ethers.Contract(bankAddress[0], bankAbi, provider)
      const rewards = await bankContract.functions.getRewards(selectedBank.tokenId)
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
    const assetToConvert = [{contract_address: asset.contract_address, contract_decimals: asset.contract_decimals, tokensSupplied: tokens.toString()}]
    // @ts-ignore
    for (const [index, condition] of liquidationConditions.entries()) {
      const desiredAsset = [{
        contract_address: condition.convertTo.contract_address,
        percentage: 100,
        minOut: 0,
        contract_decimals: condition.convertTo.contract_decimals
      }]
      const {wantedAssets} = await getAmountsOut(contracts, signer, assetToConvert, desiredAsset)
      const expectedUsdOut = wantedAssets[0].value
      const slippage = 100*(+currentUsd-expectedUsdOut)/+currentUsd
      if (slippage>condition.slippage+0.2) {
        setError(`Calculated slippage for condition ${index+1} was ${slippage.toFixed(3)}% which is too close to the input slippage.
        Please increase the slippage tolerance to ${condition.slippage+0.2} or greater`)
        onOpen()
        setProcessing(false)
        return
      }
    }
    const formattedConditions = liquidationConditions.map((condition, index) => {
      try {
        return {
          watchedToken: condition.watchedAsset.contract_address,
          liquidateTo: condition.convertTo.contract_address,
          lessThan: condition.lessThan,
          liquidationPoint: ethers.utils.parseUnits(condition.liquidationPoint.toString(), 18),
          slippage: ethers.utils.parseUnits((condition.slippage/100).toString(), 18)
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
    if (!selectedBank) {
      setError(`Unsupported asset`)
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
      bankId: selectedBank.id,
      bankToken: selectedBank.tokenId,
      amount: ethers.utils.parseUnits(tokens.toString(), asset.contract_decimals),
      liquidationPoints: formattedConditions
    }
    depositNew(contracts, signer, position, asset).then((hash:string) => {
      setProcessing(false)
      setTxHash(hash)
      onOpenSuccess()
    }).catch((error)=>{
      setProcessing(false)
      onError(error)
      console.log("Transaction failed", error)
    })
  }


  return (
    <Box maxWidth={'700px'} margin={'auto'}
      justifyContent={'space-between'}
      bg={useColorModeValue(...level1)}
      boxShadow={'2xl'}
      rounded={'lg'}
      p={{base:4, md: 8}}>
      <Flex mb={'3'} justifyContent={'space-between'}>
        <Heading2>Secure {asset?.contract_name}</Heading2>
        <Button onClick={exitSecuring} alignSelf={'start'} marginBottom={3}><ArrowBackIcon/>Back</Button>
      </Flex>
      <Grid
        w={'100%'}
        gridTemplateRows={'1fr 1fr'}
        rowGap='4'
        templateColumns={{base: 'repeat(2, 1fr)', md: '3fr 3fr 0.5fr'}}
        mb={'8'}
      >
        <GridItem colSpan={1}>
          <Heading2>Tokens To Secure</Heading2>
          <Flex>
          <NumberInput backgroundColor='hidden' size={'lg'} w={'60%'} min={0} max={asset?.balance/10**asset?.contract_decimals} value={tokens}
          // @ts-ignore
          onChange={(valueAsString)=>setTokens(valueAsString)}>
            <NumberInputField backgroundColor={useColorModeValue('white', 'gray.900')}></NumberInputField>
          </NumberInput>
          <Box>
            <Text paddingInline={'1'} backgroundColor='blue.500' color={'white'} ml={'2'} _hover={{cursor: 'pointer', backgroundColor:'blue.300'}}
            onClick={()=>{setTokens(+ethers.utils.formatUnits(asset?.balance||0, asset?.contract_decimals||1))}}>Max</Text>
          </Box>
          </Flex>
        </GridItem>
        <GridItem colSpan={1}>
          <Heading2>Secured USD</Heading2>
          <Text fontSize='l'>${currentUsd}</Text>
        </GridItem>
        <GridItem rowStart={2} colSpan={1}>
          <Heading2>Expected Rewards</Heading2>
          {
            rewards?rewards.length>0?
            rewards.map(reward=> <Text fontSize='l'>{reward}</Text>):
            <Text fontSize='l'>None</Text>:
            <Skeleton w={'60%'}>
              <Text>Temporary</Text>
              <Text>Temporary</Text>
            </Skeleton>
          }
        </GridItem>
        <GridItem rowStart={2} colSpan={1}>
          <Heading2>Expected APY</Heading2>
          <Text>Coming Soon</Text>
        </GridItem>
      </Grid>
      <Heading2>Liquidation Conditions</Heading2>
      <Flex margin={'auto'} marginTop={{base:'0px', sm: '-40px'}}>
        <LiquidationConditions
        liquidationPoints = {liquidationConditions}
        onChangeConditions={setLiquidationConditions} resetFlag={undefined} assetPrice={currentUsd}
        onReload={softRefreshAssets} loading={loading}/>
      </Flex>
      <Flex marginBlock={'10'} justifyContent={'center'}>
      <FancyButton
        disabled={!selectedBank || +tokens===0 || processing || !rewards}
        isLoading={processing} width='70%' height='85px' onClick={secure}><Text fontSize={'3xl'} color={'white'}>Secure</Text></FancyButton>
      </Flex>
      <Modal size={'sm'} isCentered isOpen={isOpenSuceess} onClose={onCloseSuccess}>
        <ModalOverlay
          bg='blackAlpha.300'
          backdropFilter='blur(10px)'
        />
        <ModalContent>
          <ModalHeader>
            <Flex alignItems={'center'}>
              {<CheckCircleIcon color='green.400' fontSize={'2rem'}/>}
              <Text ml={'4'}>Deposit Successful</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Asset was deposited successfully, 
              you can view your position <Link href={`/Positions`}><Text color='blue.500' _hover={{cursor: 'pointer'}} as={'u'}>here</Text></Link>. 
              View <a href={getBlockExplorerUrlTransaction(chainId, txHash)} target="_blank" rel="noopener noreferrer"><Text as='u' textColor={'blue.500'}>Transaction</Text></a> on block explorer</Text>
          </ModalBody>
          <ModalFooter>
          </ModalFooter>
        </ModalContent>
      </Modal>
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
  const {userAssets, supportedAssets, softRefreshAssets} = useAppContext()
  const assets = userAssets?.data
  const [securing, setSecuring] = useState<number>()

  useEffect(() => {
    if (!assets) {
      setSecuring(undefined)
    }
  }, assets)

  return (
    <Box justifyContent={'center'} justifySelf='center' maxWidth='1200px' marginTop={'50px'} marginInline={'auto'}>
      {
        securing!=undefined && assets?
        <SecureAsset asset={assets[securing]} setSecuring={setSecuring} />:       
        <Box marginInline={'auto'} maxW={'1000px'}>
          <Pagination
          cards={assets?.map((asset, index)=><Card asset={asset} index={index} setSecuring={setSecuring}></Card>)}
          placeholder={<Text textAlign={'center'} mt={'20'}>{!('ERC20' in supportedAssets)?'Website still deploying, try reloading in a minute':'No Assets detected'}</Text>}
          ></Pagination>
          <Flex wrap={'wrap'} justifyContent={'center'} alignContent={'stretch'} maxW={'1000px'}>
          </Flex>
        </Box>
      }
    </Box>
  )
}

export default Assets