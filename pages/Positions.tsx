import { useWeb3React } from "@web3-react/core";
import { useAppContext } from "../components/Provider"
import { Box, Flex, Table, TableContainer, Tbody, Th, Thead, Tr, Text, Td, Button, Center, Heading, Stack, useColorModeValue, SkeletonText, Skeleton, HStack, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { fetchPositions } from "../contractCalls/dataFetching";
import { Pagination } from "../components/Pagination";
import { Heading1 } from "../components/Typography";
import { VscGraphLine } from 'react-icons/vsc'
import { IoMdSettings } from 'react-icons/io'
import { ethers } from "ethers";
import { getBlockExplorerUrl, getLogoUrl, getTokenDetails, nFormatter } from "../utils";
import erc20Abi from "../constants/abis/ERC20.json"
import { AiOutlineShrink, AiOutlineExpandAlt } from 'react-icons/ai'
import { harvest, compound } from "../contractCalls/transactions";

const Card = ({id}) => {
  const {contracts, chainId, onError} = useAppContext()
  const {provider} = useWeb3React()
  const [asset, SetAsset] = useState(undefined)
  const [underlying, setUnderlying] = useState(undefined)
  const [rewards, setRewards] = useState(undefined)
  const [usdcValue, setUsdcValue] = useState(undefined)
  const [contractAddress, setContractAddress] = useState()
  const [expandRewards, setExpandRewards] = useState(false)
  const [isHarvesting, setHarvesting] = useState(false)
  const [isCompounding, setCompounding] = useState(false)
  const [refresh, setRefresh] = useState(false)

  useEffect(() => {
    const getAssetData = async () => {
      const contract = new ethers.Contract(contractAddress, erc20Abi, provider)
      const symbol = await contract.symbol()
      SetAsset({contract_ticker_symbol: symbol, contract_address: contractAddress, logo_url: (await getLogoUrl(contract, chainId))})
    }
    if (contractAddress) {
      getAssetData()
    }
  }, [contractAddress])

  console.log(rewards)

  useEffect(() => {
    contracts.usdcContract.decimals().then(usdcDecimals => {
      contracts.positionManager.callStatic.closeToUSDC(id).then((usdcValue)=> {
        const usd = ethers.utils.formatUnits(usdcValue, usdcDecimals)
        setUsdcValue(nFormatter(usd, 3))
      })
    })
    contracts.positionManager.getPosition(id).then(async (positionData) => {
      contracts.positionManager.callStatic.harvestRewards(id).then(async ({rewards, rewardAmounts})=> {
        const promises = rewards.map(async (token, index)=> {
          const tokenData = await getTokenDetails(chainId, token)
          const contract = new ethers.Contract(token, erc20Abi, provider)
          const amount = +ethers.utils.formatUnits(rewardAmounts[index].toString(), tokenData.decimals)
          const usdValue = amount*tokenData.price
          return {
            contract_ticker_symbol: tokenData.symbol,
            contract_address: token,
            logo_url: (await getLogoUrl(contract, chainId)),
            usdValue,
            amount
          }
        })
        const rewardData = await Promise.all(promises)
        setRewards(rewardData)
      })
      const bankDetails = await contracts.banks[positionData.bankId.toNumber()].decodeId(positionData.bankToken)
      setContractAddress(bankDetails[0])
      contracts.universalSwap.callStatic.getUnderlying(bankDetails[0]).then(underlyingAddresses=> {
        const promises = underlyingAddresses.map(async address=> {
          const contract = new ethers.Contract(address, erc20Abi, provider)
          const symbol = await contract.symbol()
          return {contract_address: address, contract_ticker_symbol: symbol, logo_url: (await getLogoUrl(contract, chainId))}
        })
        Promise.all(promises).then((underlying)=>setUnderlying(underlying))
      })
    })
  }, [id, refresh])

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
    compound(contracts, id).then(()=>{
      setCompounding(false)
      setRefresh(!refresh)
    }).catch((error)=>{
      onError(error)
      setCompounding(false)
    })
  }

  return (
    <Box position='relative' margin={'6'} minW={'300px'}>
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
                  <Button colorScheme={'blue'} mr={'3'} size={'sm'} onClick={harvestPosition}>Harvest</Button>
                  <Button colorScheme={'blue'} size={'sm'} onClick={compoundPosition}>Reinvest</Button>
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
  const [positions, setPositions] = useState(undefined)
  const [numPositions, setNumPositions] = useState(0)

  useEffect(() => {
    if (!contracts?.positionManager) return
    contracts.positionManager.numUserPositions(account).then(n=>setNumPositions(n.toNumber()))
  }, [contracts, provider, account])

  useEffect(() => {
    const fetchUserPositions = async () => {
      const positions = await fetchPositions(contracts, provider.getSigner(account))
      setPositions(positions)
    }
    if (contracts && provider) {
      fetchUserPositions()
    }
  }, [contracts, provider, account])

  return <>
    <Flex direction={'column'} justifyContent={'center'}>
      <Flex marginInline={'auto'} wrap={'wrap'} justifyContent={'center'} alignContent={'stretch'} maxW={'1000px'}>
      <Pagination
      cards={Array.from(Array(numPositions).keys()).map(id=><Card id={id}></Card>)}
      placeholder={
        <Text mt={'20'}>
          No positions detected. <Link href={`/`}><Text color='blue' _hover={{cursor: 'pointer'}} as={'u'}>Click here</Text></Link> to create a position using your assets
        </Text>
      }
      loading={false}></Pagination>
      </Flex>
    </Flex>
  </>
}

export default Positions