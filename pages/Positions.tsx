import { useWeb3React } from "@web3-react/core";
import { useAppContext } from "../components/Provider"
import { Box, Flex, Text, Button, Heading, Stack, useColorModeValue, Skeleton, VStack, Image } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { Pagination } from "../components/Pagination";
import { VscGraphLine } from 'react-icons/vsc'
import { IoMdSettings } from 'react-icons/io'
import { ethers } from "ethers";
import { getBlockExplorerUrl, getBlockExplorerUrlTransaction, getLogoUrl, nFormatter, supportedChainAssets } from "../utils";
import erc20Abi from "../constants/abis/ERC20.json"
import { AiOutlineShrink } from 'react-icons/ai'
import { harvest, compound } from "../contractCalls/transactions";
import { nativeTokens } from "../utils";
import { PrimaryButton } from "../components/Buttons";
import { level1, level2 } from "../components/Theme";
import { PositionStructOutput } from "../codegen/PositionManager";
import { ERC20__factory } from "../codegen";
import { Asset, UserAsset } from "../Types";

const Card = ({id}: {id:number}) => {
  const {contracts, chainId, onError, slippageControl: {slippage}, successModal} = useAppContext()
  const {provider} = useWeb3React()
  const [asset, setAsset] = useState<Asset>(undefined)
  const [underlying, setUnderlying] = useState<UserAsset[]>(undefined)
  const [positionInfo, setPositionInfo] = useState<PositionStructOutput>()
  const [rewards, setRewards] = useState<UserAsset[]>(undefined)
  const [usdcValue, setUsdcValue] = useState<string>()
  const [expandRewards, setExpandRewards] = useState(false)
  const [isHarvesting, setHarvesting] = useState(false)
  const [isCompounding, setCompounding] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const [isClosed, setIsClosed] = useState(false)

  useEffect(() => {
    contracts.positionManager.getPosition(id).then(async (positionData) => {
      const {position, bankTokenInfo, underlyingTokens, underlyingAmounts, underlyingValues, rewardTokens, rewardAmounts, rewardValues, usdValue} = positionData
      setPositionInfo(position)
      const stableDecimals = await contracts.stableToken.decimals()
      const usd = ethers.utils.formatUnits(usdValue, stableDecimals)
      setUsdcValue(nFormatter(usd, 3))
      const getAssetData = async () => {
        if (bankTokenInfo.lpToken!=ethers.constants.AddressZero) {
          const contract = ERC20__factory.connect(bankTokenInfo.lpToken, provider)
          const symbol = await contract.symbol()
          const name = await contract.name()
          setAsset({
            contract_name: name,
            chain_id: chainId, contract_decimals: undefined, underlying: [], protocol_name: undefined,
            contract_ticker_symbol: symbol, contract_address: bankTokenInfo.lpToken, logo_url: getLogoUrl(name, contract.address, chainId)})
        } else {
          setAsset(nativeTokens[chainId])
        }
      }
      getAssetData()
      const underlyingPromises = underlyingTokens.map(async (token:string, index:number) => {
        let name: string; let decimals: number; let symbol: string;
        if (token!=ethers.constants.AddressZero) {
          const contract = new ethers.Contract(token, erc20Abi, provider)
          symbol = await contract.symbol()
          name = await contract.name()
          decimals = await contract.decimals()
        } else {
          const networkAsset = supportedChainAssets[chainId].find(asset=>asset.contract_address===ethers.constants.AddressZero)
          name = networkAsset.contract_name
          symbol = networkAsset.contract_ticker_symbol
          decimals = networkAsset.contract_decimals
        }
        const amount = ethers.utils.formatUnits(underlyingAmounts[index], decimals)
        const usdValue = +ethers.utils.formatUnits(underlyingValues[index], stableDecimals)
        return {
          contract_name: name, contract_address: token, contract_ticker_symbol: symbol,
          contract_decimals: decimals, quote: usdValue, quote_rate: 0, chain_id: chainId,
          balance: underlyingAmounts[index].toString(), formattedBalance: amount, underlying: [], protocol_name: '',
          logo_url: getLogoUrl(name, token, chainId)
        }
      })
      Promise.all(underlyingPromises).then((underlying)=>setUnderlying(underlying))
      const rewardPromises = rewardTokens.map(async (token:string, index:number) => {
        const contract = ERC20__factory.connect(token, provider)
        const symbol = await contract.symbol()
        const name = await contract.name()
        const decimals = await contract.decimals()
        const amount = ethers.utils.formatUnits(rewardAmounts[index], decimals)
        const usdValue = +ethers.utils.formatUnits(rewardValues[index], stableDecimals)
        return {
          contract_name: name, contract_address: token, contract_ticker_symbol: symbol,
          contract_decimals: decimals, quote: usdValue, quote_rate: 0, chain_id: chainId,
          balance: rewardAmounts[index].toString(), formattedBalance: amount, underlying: [], protocol_name: '',
          logo_url: getLogoUrl(name, contract.address, chainId)}
      })
      Promise.all(rewardPromises).then((rewardsData)=>setRewards(rewardsData))
    })
    contracts.positionManager.positionClosed(id).then(positionClosed=> {
      if (positionClosed) {
        setIsClosed(true)
        // setUsdcValue('0')
        // setRewards([])
      }
    })
  }, [id, refresh, contracts.positionManager.signer])

  const harvestPosition = () => {
    setHarvesting(true)
    harvest(contracts, id).then((hash)=>{
      setHarvesting(false)
      setRefresh(!refresh)
      successModal("Harvest Successful", 
        <Text>
          Rewards were successfully harvested, 
          View <a href={getBlockExplorerUrlTransaction(chainId, hash)} target="_blank" rel="noopener noreferrer"><Text as='u' textColor={'blue.500'}>transaction</Text></a>
          &nbsp;on block explorer.
        </Text>
      )
    }).catch((error)=>{
      setHarvesting(false)
      onError(error)
    })
  }

  const compoundPosition = () => {
    setCompounding(true)
    compound(contracts, id, positionInfo, slippage, chainId).then((hash)=>{
      setCompounding(false)
      setRefresh(!refresh)
      successModal("Reinvest Successful", 
        <Text>
          Rewards were successfully reinvested, 
          View <a href={getBlockExplorerUrlTransaction(chainId, hash)} target="_blank" rel="noopener noreferrer"><Text as='u' textColor={'blue.500'}>transaction</Text></a>
          &nbsp;on block explorer.
        </Text>
      )
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
        bg={useColorModeValue(...level1)}
        boxShadow={'2xl'}
        rounded={'lg'}
        p={6}
        textAlign={'center'}>
        <Flex mb={'3'} pb={'3'} justifyContent={'center'} alignItems={'center'}>
          {
            asset?
          <Flex><Image src={asset.logo_url} fallbackSrc='https://www.svgrepo.com/show/99387/dollar.svg' borderRadius={'full'} style={{width: "30px", height: "30px"}}/>
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
            <Flex mt={'1'} flexDirection={'column'} alignItems={expandRewards?'start':'end'} ml={'6'} p={'3'} borderRadius={'lg'}
            backgroundColor={useColorModeValue(...level2)}
            _hover={{cursor: !expandRewards?'pointer':'auto', backgroundColor: useColorModeValue('gray.200', !expandRewards?'gray.600':'gray.700')}}
            onClick={()=>!expandRewards?setExpandRewards(!expandRewards):{}} position={expandRewards?'absolute':'static'}
            right='24px' left='0px' boxShadow={expandRewards?'xl':'none'} sx={{'transition': '0.4s'}}>
              {
                rewards?.map(reward=> <Flex>
                  <Image src={reward.logo_url} fallbackSrc='https://www.svgrepo.com/show/99387/dollar.svg'
                  style={{width: "20px", height: "20px", borderRadius: '15px'}}/>
                  <a href={getBlockExplorerUrl(chainId, reward.contract_address)} target="_blank" rel="noopener noreferrer">
                  <Text _hover={{color: 'blue.500', cursor: 'pointer'}} display={'flex'} alignItems={'center'} ml={'2'} mr={'1'}>
                    {reward.contract_ticker_symbol}
                  </Text>
                  </a>
                  {
                    expandRewards?<Text>: {nFormatter(reward.formattedBalance, 2)} (${nFormatter(reward.quote, 2)})</Text>:<></>
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
          <PrimaryButton disabled={isClosed} flex={1}>
            <IoMdSettings fontSize={'1.3rem'}></IoMdSettings>
            &nbsp;Edit
          </PrimaryButton>
        </Link>
        <Link href={`/analytics/${id}`}>
        <Button color='white' bgColor={useColorModeValue('green.500', 'green.600')}
          _hover={{bgColor: useColorModeValue('green.600', 'green.700')}}
          _focus={{bgColor: useColorModeValue('green.700', 'green.800')}} rounded={'full'}>
          <VscGraphLine fontSize={'1.3rem'}></VscGraphLine>
          &nbsp;Analytics</Button>
        </Link>
        </Stack>
      </Flex>
    </Box>
  )
}

const Positions = () => {
  const {contracts} = useAppContext()
  const {account, provider} = useWeb3React()
  const [userPositions, setUserPositions] = useState<number[]>()

  useEffect(() => {
    if (!contracts?.positionManager) return
    const getPositions = async () => {
      const positions = await contracts.positionManager.getPositions(account)
      setUserPositions(positions.map(position=>position.toNumber()))
    }
    getPositions()
  }, [contracts, provider, account])

  return <>
    <Flex marginTop={'50px'} direction={'column'} justifyContent={'center'}>
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