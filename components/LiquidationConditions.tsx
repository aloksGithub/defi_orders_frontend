import { AddIcon, DeleteIcon } from "@chakra-ui/icons"
import { Text, Flex, NumberInput, NumberInputField, Button, Box, IconButton, Skeleton, useColorModeValue } from "@chakra-ui/react"
import { ethers } from "ethers"
import { useEffect, useState } from "react"
import { useAppContext } from "./Provider"
import { SelectAsset } from "./selectAssets";
import { getPrice } from "../utils";
import { Reload } from "./Reload";
import { level2 } from "./Theme"

const Condition = ({i, condition, setWatchedAsset, setConvertTo, removeAsset, setLiquidationPoint, loading}) => {
  const {supportedAssets} = useAppContext()
  // Need to remove network token as in the contracts, the network token and the position are both referred to with the zero address
  // @ts-ignore
  const withoutNetworkToken = supportedAssets?.ERC20?.filter(asset=>asset.contract_address!=ethers.constants.AddressZero)
  const self = {
    value: ethers.constants.AddressZero,
    label: 'Value of self',
    contract_name: 'Value of self',
    contract_ticker_symbol: 'Self',
    contract_address: ethers.constants.AddressZero,
    underlying:[],
    logo_url: 'https://www.svgrepo.com/show/99387/dollar.svg'
  }

  const onSelectConvertTo = (asset) => {
    setConvertTo(asset)
  }

  return (
    <Flex marginBlock={'2'} padding={'4'} borderRadius={'2xl'} backgroundColor={useColorModeValue(...level2)} justifyContent='space-between' minWidth={'400px'} width={'100%'}>
      <Box marginBlock={'auto'}>
        <Flex mb={'4'}>
          {/* @ts-ignore */}
          <SelectAsset asset={condition.watchedAsset} onSelect={setWatchedAsset} assets={[self, ...(withoutNetworkToken||[])]} placeHolder={'Watched price'}/>
        </Flex>
        <Flex alignItems={'center'}>
          {/* @ts-ignore */}
          <SelectAsset asset={condition.convertTo} onSelect={onSelectConvertTo} assets={supportedAssets.ERC20} placeHolder={'liquidate To'}/>
        </Flex>
      </Box>
      <Flex>
        <Flex justifyContent={'center'} alignItems={'end'} flexDirection={'column'} mr={'4'}>
          <Text mb={'2'} as='b'>Liquidate at price</Text>
          <NumberInput value={condition.liquidationPoint||'0'} width={'40'}
          onChange={(valueAsNumber)=>setLiquidationPoint(valueAsNumber)}>
            <NumberInputField backgroundColor={useColorModeValue('white', 'gray.800')}></NumberInputField>
          </NumberInput>
          <Flex>
          <Text>Current Price:&nbsp;</Text>
          {
            !loading?<Text>${(+(condition.price)||0).toFixed(3)}</Text>:<Skeleton><Text>TEMP</Text></Skeleton>
          }
          </Flex>
        </Flex>
        <Flex alignItems={'center'} paddingBlock={'8'} pl={'3'} borderLeft={'1px'} borderColor={useColorModeValue('white', 'gray.800')}>
          <Text textAlign={'center'} borderRadius={'lg'} width={'2rem'} padding={'1'}
          onClick={()=>removeAsset(i)}
          _hover={{cursor: 'pointer', backgroundColor: 'red.400'}} backgroundColor='red.300'><DeleteIcon/></Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

  // @ts-ignore
const LiquidationConditions = ({assetPrice, initialLiquidationPoints=undefined, liquidationPoints, onChangeConditions, resetFlag, onReload, loading}) => {
  const {chainId} = useAppContext()
  
  const [initialized, setInitialized] = useState(false)
  const [loadingPrices, setLoadingPrices] = useState(Array(liquidationPoints?.length || 0).fill(false))

  useEffect(()=> {
    if (initialLiquidationPoints && initialLiquidationPoints.length>0 && !initialized) {
      setInitialized(true)
      onChangeConditions(JSON.parse(JSON.stringify(initialLiquidationPoints)))
    }
  }, [initialLiquidationPoints])

  useEffect(()=> {
    if (initialLiquidationPoints) {
      onChangeConditions(JSON.parse(JSON.stringify(initialLiquidationPoints)))
    }
  }, [resetFlag])

  useEffect(() => {
    if (liquidationPoints) {
      const temp = [...liquidationPoints]
      for (const condition of temp) {
        if (condition.watchedAsset?.contract_address===ethers.constants.AddressZero) {
          condition.price = assetPrice
          condition.lessThan = +condition.liquidationPoint<+assetPrice
        }
      }
      onChangeConditions(temp)
    }
  }, [assetPrice])

  const reload = async () => {
    onReload()
    if (liquidationPoints) {
      // @ts-ignore
      for (const [index, condition] of liquidationPoints.entries()) {
        setWatchedAsset(index, condition.watchedAsset)
      }

    }
  }

  const addCondition = () => {
  const temp = [...liquidationPoints]
    temp.push({
      watchedAsset: undefined,
      liquidationPoint: 0,
      lessThan: false,
      convertTo: undefined,
      price: 0
    })
    setLoadingPrices(loadingPrices.concat([false]))
    onChangeConditions(temp)
  }

  const removeCondition = (index: number) => {
    if (liquidationPoints.length===1) return
    const temp = [...liquidationPoints]
    temp.splice(index, 1)
    loadingPrices.splice(index, 1)
    setLoadingPrices(loadingPrices)
    onChangeConditions(temp)
  }

  const setConvertTo = (index, asset) => {
    const temp = [...liquidationPoints]
    temp[index].convertTo = asset
    onChangeConditions(temp)
  }

  const setWatchedAsset = (index, asset) => {
    const temp = [...liquidationPoints]
    temp[index].watchedAsset = asset
    const setPrice = async () => {
      if (asset?.contract_address===ethers.constants.AddressZero) {
        temp[index].price=assetPrice
      } else {
        if (asset?.contract_address) {
          const {price} = await getPrice(chainId, asset.contract_address)
          temp[index].price=price
        }
      }
      if (+temp[index].liquidationPoint<+temp[index].price) {
        temp[index].lessThan = true
      } else {
        temp[index].lessThan = false
      }
      onChangeConditions(temp)
      loadingPrices[index] = false
      setLoadingPrices(loadingPrices)
    }
    setPrice()
    loadingPrices[index] = asset?.contract_address===ethers.constants.AddressZero?false:true
    setLoadingPrices(loadingPrices)
  }

  const setLiquidationPoint = (index, point:number) => {
    const temp = [...liquidationPoints]
    temp[index].liquidationPoint = point
    if (+point<+temp[index].price) {
      temp[index].lessThan = true
    } else {
      temp[index].lessThan = false
    }
    onChangeConditions(temp)
  }
  console.log(loading, loadingPrices)

  return (
    <Box marginTop={'5'} width={'100%'}>
      <Box margin={'auto'} maxWidth='500px' overflowX={'auto'}>
        <Flex justifyContent={'end'}>
          <Reload onReload={reload} loading={loading}/>
          <IconButton ml={'2'} color='white' bgColor={useColorModeValue('blue.500', 'blue.600')}
          _hover={{bgColor: useColorModeValue('blue.600', 'blue.700')}}
          _focus={{bgColor: useColorModeValue('blue.700', 'blue.800')}} aria-label='Add condition' onClick={addCondition} icon={<AddIcon />} />
        </Flex>
        {
          liquidationPoints&&liquidationPoints.length>0?
          liquidationPoints.map((condition, index)=> {
            return(
            <Condition
              i={index}
              condition={condition}
              setConvertTo={(asset)=>setConvertTo(index, asset)}
              setWatchedAsset={(asset)=>setWatchedAsset(index, asset)}
              removeAsset={()=>removeCondition(index)}
              setLiquidationPoint={(point)=>setLiquidationPoint(index, point)}
              loading={loading || loadingPrices[index]}/>
          )}):<Skeleton minWidth={'500px'} height='140' marginBlock={'2'} padding={'4'} borderRadius={'2xl'}></Skeleton>
        }
      </Box>
    </Box>
  )
}

export default LiquidationConditions