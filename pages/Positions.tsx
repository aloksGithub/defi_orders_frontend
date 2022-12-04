import { useWeb3React } from "@web3-react/core";
import { useAppContext } from "../components/Provider"
import { Box, Flex, Table, TableContainer, Tbody, Th, Thead, Tr, Text, Td, Button, Center, Heading, Stack, useColorModeValue, SkeletonText, Skeleton, HStack, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { Pagination } from "../components/Pagination";
import { Heading1 } from "../components/Typography";
import { VscGraphLine } from 'react-icons/vsc'
import { IoMdSettings } from 'react-icons/io'
import { ethers } from "ethers";
import { getBlockExplorerUrl, getLogoUrl, getTokenDetails, nFormatter } from "../utils";
import erc20Abi from "../constants/abis/ERC20.json"
import { AiOutlineShrink, AiOutlineExpandAlt } from 'react-icons/ai'
import { harvest, compound } from "../contractCalls/transactions";
import { nativeTokens } from "../utils";

const Card = ({id}) => {
  const {contracts, chainId, onError, slippageControl: {slippage}} = useAppContext()
  const {provider, account} = useWeb3React()
  const [asset, SetAsset] = useState(undefined)
  const [underlying, setUnderlying] = useState(undefined)
  const [rewards, setRewards] = useState(undefined)
  const [usdcValue, setUsdcValue] = useState(undefined)
  const [expandRewards, setExpandRewards] = useState(false)
  const [isHarvesting, setHarvesting] = useState(false)
  const [isCompounding, setCompounding] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const [isClosed, setIsClosed] = useState(false)

  useEffect(() => {
    contracts.positionManager.getPosition(id).then(async (positionData) => {
      const {position, bankTokenInfo, underlyingTokens, underlyingAmounts, underlyingValues, rewardTokens, rewardAmounts, rewardValues, usdValue} = positionData
      const stableDecimals = await contracts.stableToken.decimals()
      const usd = ethers.utils.formatUnits(usdValue, stableDecimals)
      setUsdcValue(nFormatter(usd, 3))
      const getAssetData = async () => {
        if (bankTokenInfo.lpToken!=ethers.constants.AddressZero) {
          const contract = new ethers.Contract(bankTokenInfo.lpToken, erc20Abi, provider)
          const symbol = await contract.symbol()
          const name = await contract.name()
          SetAsset({contract_ticker_symbol: symbol, contract_address: bankTokenInfo.lpToken, logo_url: getLogoUrl(name, contract.address, chainId)})
        } else {
          SetAsset(nativeTokens[chainId])
        }
      }
      getAssetData()
      const underlyingPromises = underlyingTokens.map(async (token:string, index:number) => {
        if (token!=ethers.constants.AddressZero) {
          const contract = new ethers.Contract(token, erc20Abi, provider)
          const symbol = await contract.symbol()
          const name = await contract.name()
          const decimals = await contract.decimals()
          const amount = +ethers.utils.formatUnits(underlyingAmounts[index], decimals)
          const usdValue = +ethers.utils.formatUnits(underlyingValues[index], stableDecimals)
          return {contract_address: token, amount, usdValue, contract_ticker_symbol: symbol, logo_url: getLogoUrl(name, contract.address, chainId)}
        } else {
          return nativeTokens[chainId]
        }
      })
      Promise.all(underlyingPromises).then((underlying)=>setUnderlying(underlying))
      const rewardPromises = rewardTokens.map(async (token:string, index:number) => {
        const contract = new ethers.Contract(token, erc20Abi, provider)
        const symbol = await contract.symbol()
        const name = await contract.name()
        const decimals = await contract.decimals()
        const amount = +ethers.utils.formatUnits(rewardAmounts[index], decimals)
        const usdValue = +ethers.utils.formatUnits(rewardValues[index], stableDecimals)
        return {contract_address: token, amount, usdValue, contract_ticker_symbol: symbol, logo_url: getLogoUrl(name, contract.address, chainId)}
      })
      Promise.all(rewardPromises).then((rewardsData)=>setRewards(rewardsData))
    })
    contracts.positionManager.positionClosed(id).then(positionClosed=> {
      if (positionClosed) {
        setIsClosed(true)
        setUsdcValue(0)
        setRewards([])
      }
    })
  }, [id, refresh, contracts.positionManager.signer])

  const harvestPosition = () => {
    setHarvesting(true)
    harvest(contracts, id).then(()=>{
      setHarvesting(false)
      setRefresh(!refresh)
    }).catch((error)=>{
      setHarvesting(false)
      onError(error)
    })
  }

  const compoundPosition = () => {
    setCompounding(true)
    compound(contracts, id, slippage, chainId).then(()=>{
      setCompounding(false)
      setRefresh(!refresh)
    }).catch((error)=>{
      onError(error)
      setCompounding(false)
    })
  }

  return (
    <Box position='relative' minW={'300px'}>
      <Flex direction={'column'}
        justifyContent={'space-between'}
        h={'100%'}
        w={'full'}
        bg={useColorModeValue('white', 'gray.900')}
        boxShadow={'2xl'}
        rounded={'lg'}
        p={6}
        textAlign={'center'}>
        <Flex mb={'3'} pb={'3'} justifyContent={'center'} alignItems={'center'}>
          {
            asset?
          <Flex><img src={asset.logo_url} style={{width: "30px", height: "30px"}}/>
          <a href={getBlockExplorerUrl(chainId, asset.contract_address)} target="_blank" rel="noopener noreferrer">
          <Heading _hover={{color: 'blue.500'}} ml={'3'} fontSize={'xl'}>
          {asset.contract_ticker_symbol}
          </Heading>
          </a></Flex>:<Skeleton><Heading>Temp Title</Heading></Skeleton>

          }
        </Flex>
        <Flex>
        <Box width={'100%'}>
        <Flex mb={'3'} flexDir={'column'} alignItems={'start'}>
          <Heading fontSize={'m'} >
          Underlying
          </Heading>
          <Box mt={'1'}>
          {
            underlying?underlying.map((token)=> 
            <Flex alignItems={'center'}>
              <img src={token.logo_url} style={{width: "20px", height: "20px", borderRadius: '15px'}}/>
              <a href={getBlockExplorerUrl(chainId, token.contract_address)} target="_blank" rel="noopener noreferrer">
              <Text _hover={{color: 'blue.500', cursor: 'pointer'}} display={'flex'} alignItems={'center'} ml={'2'} mr={'1'}>
                {token.contract_ticker_symbol}
              </Text>
              </a>
            </Flex>):<VStack gap={'1'} m='1'>
              <Skeleton><Text>Temp Token</Text></Skeleton><Skeleton><Text>Temp Token</Text></Skeleton>
              </VStack>
          }
          </Box>
        </Flex>
        <Flex mb={'3'} flexDir={'column'} alignItems={'start'}>
          <Heading fontSize={'m'} >
          USD Value
          </Heading>
          <Flex justifyContent={'center'}>${usdcValue?usdcValue:<Skeleton m='1'><Text>Temp</Text></Skeleton>}</Flex>
        </Flex>
        </Box>
        {
          rewards&&rewards.length>0?
          <Box width={'100%'}>
            <Heading textAlign={'end'} fontSize={'m'}>
            Rewards
            </Heading>
            <Flex mt={'1'} flexDirection={'column'} alignItems={expandRewards?'start':'end'} ml={'6'} p={'3'} borderRadius={'lg'} backgroundColor={'gray.100'}
            _hover={{cursor: !expandRewards?'pointer':'auto', backgroundColor: 'gray.200'}}
            onClick={()=>!expandRewards?setExpandRewards(!expandRewards):{}} position={expandRewards?'absolute':'static'}
            right='24px' left='0px' boxShadow={expandRewards?'xl':'none'} sx={{'transition': '0.4s'}}>
              {
                rewards?.map(reward=> <Flex>
                  <img src={reward.logo_url} style={{width: "20px", height: "20px", borderRadius: '15px'}}/>
                  <a href={getBlockExplorerUrl(chainId, reward.contract_address)} target="_blank" rel="noopener noreferrer">
                  <Text _hover={{color: 'blue.500', cursor: 'pointer'}} display={'flex'} alignItems={'center'} ml={'2'} mr={'1'}>
                    {reward.contract_ticker_symbol}
                  </Text>
                  </a>
                  {
                    expandRewards?<Text>: {nFormatter(reward.amount, 2)} (${nFormatter(reward.usdValue, 2)})</Text>:<></>
                  }
                </Flex>)
              }
              {
                expandRewards?<Flex margin={'auto'} mt={'6'}>
                  <Button isLoading={isHarvesting} colorScheme={'blue'} mr={'3'} size={'sm'} onClick={harvestPosition}>Harvest</Button>
                  <Button isLoading={isCompounding} colorScheme={'blue'} size={'sm'} onClick={compoundPosition}>Reinvest</Button>
                  <Box _hover={{cursor: 'pointer'}} onClick={()=>setExpandRewards(false)} position={'absolute'} top='8px' right='8px'>
                    <Text _hover={{color: 'blue.300'}}>
                    <AiOutlineShrink fontSize={'1.3rem'}></AiOutlineShrink>
                    </Text>
                  </Box>
                </Flex>:<></>
              }
            </Flex >
          </Box>:<></>
        }
        </Flex>

        <Stack mt={8} direction={'row'} spacing={4}>
        <Link href={`/editPosition/${id}`}>
          <Button
            disabled={isClosed}
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
            <IoMdSettings fontSize={'1.3rem'}></IoMdSettings>
            &nbsp;Edit
          </Button>
        </Link>
        <Link href={`/analytics/${id}`}>
          <Button
            flex={1}
            fontSize={'sm'}
            rounded={'full'}
            bg={'green.400'}
            color={'white'}
            boxShadow={
              '0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)'
            }
            _hover={{
              bg: 'green.500',
            }}
            _focus={{
              bg: 'green.500',
            }}>
              <VscGraphLine fontSize={'1.3rem'}></VscGraphLine>
              &nbsp;Analytics
          </Button>
        </Link>
        </Stack>
      </Flex>
    </Box>
  )
}

const Positions = () => {
  const {contracts} = useAppContext()
  const {account, provider} = useWeb3React()
  const [userPositions, setUserPositions] = useState(undefined)

  useEffect(() => {
    if (!contracts?.positionManager) return
    const getPositions = async () => {
      const numPositions = await contracts.positionManager.numUserPositions(account)
      const positions = []
      for (let i = 0; i<numPositions; i++) {
        const position = await contracts.positionManager.userPositions(account, i)
        positions.push(position.toNumber())
      }
      setUserPositions(positions)
    }
    getPositions()
  }, [contracts, provider, account])

  return <>
    <Flex direction={'column'} justifyContent={'center'}>
      <Flex marginInline={'auto'} wrap={'wrap'} justifyContent={'center'} alignContent={'stretch'} maxW={'1000px'}>
      <Pagination
      cards={userPositions?.map(id=><Card id={id}></Card>)}
      placeholder={
        <Text mt={'20'}>
          No positions detected. <Link href={`/`}><Text color='blue' _hover={{cursor: 'pointer'}} as={'u'}>Click here</Text></Link> to create a position using your assets.
          Note: You might have to reload in a minute to see newly created positions
        </Text>
      }></Pagination>
      </Flex>
    </Flex>
  </>
}

export default Positions