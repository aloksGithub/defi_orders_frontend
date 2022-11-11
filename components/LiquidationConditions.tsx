import { AddIcon, DeleteIcon } from "@chakra-ui/icons"
import { Text, Flex, NumberInput, NumberInputField, Button, Box, Skeleton } from "@chakra-ui/react"
import { ethers } from "ethers"
import { useEffect, useState } from "react"
import { useAppContext } from "./Provider"
import { SelectAsset } from "./selectAssets";
import { getPrice } from "../utils";
import { Reload } from "./Reload";

const Condition = ({i, condition, setWatchedAsset, setConvertTo, removeAsset, setLiquidationPoint, loading}) => {
  const {supportedAssets} = useAppContext()
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
    <Flex marginBlock={'2'} padding={'4'} borderRadius={'2xl'} backgroundColor={'#f7f7f7'} justifyContent='space-between' minWidth={'400px'} width={'100%'}>
      <Box marginBlock={'auto'}>
        <Flex mb={'4'}>
          {/* @ts-ignore */}
          <SelectAsset asset={condition.watchedAsset} onSelect={setWatchedAsset} assets={[self, ...(supportedAssets.ERC20||[])]} placeHolder={'Watched price'}/>
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
            <NumberInputField backgroundColor={'white'}></NumberInputField>
          </NumberInput>
          <Flex>
          <Text>Current Price:&nbsp;</Text>
          {
            !loading?<Text>${(+(condition.price)||0).toFixed(3)}</Text>:<Skeleton><Text>TEMP</Text></Skeleton>
          }
          </Flex>
        </Flex>
        <Flex alignItems={'center'} paddingBlock={'8'} pl={'3'} borderLeft={'1px'} borderColor={'white'}>
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
    onChangeConditions(temp)
  }

  const removeCondition = (index: number) => {
    if (liquidationPoints.length===1) return
    const temp = [...liquidationPoints]
    temp.splice(index, 1)
    onChangeConditions(temp)
  }

  const setConvertTo = (index, asset) => {
    const temp = [...liquidationPoints]
    temp[index].convertTo = asset
    onChangeConditions(temp)
  }

  const setWatchedAsset = async (index, asset) => {
    const temp = [...liquidationPoints]
    temp[index].watchedAsset = asset
    if (asset?.contract_address===ethers.constants.AddressZero) {
      temp[index].price=assetPrice
    } else {
      if (asset?.contract_address) {
        const price = await getPrice(chainId, asset.contract_address)
        temp[index].price=price
      }
    }
    if (+temp[index].liquidationPoint<+temp[index].price) {
      temp[index].lessThan = true
    } else {
      temp[index].lessThan = false
    }
    onChangeConditions(temp)
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

  return (
    <Box marginTop={'5'} width={'100%'}>
      <Box margin={'auto'} maxWidth='500px' overflowX={'auto'}>
        <Flex justifyContent={'end'}>
          <Reload onReload={reload} loading={loading}/>
          <Button ml={'2'} onClick={addCondition} paddingInline={'3'} colorScheme={'blue'}><AddIcon/></Button>
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
              loading={loading}/>
          )}):<Skeleton minWidth={'500px'} height='140' marginBlock={'2'} padding={'4'} borderRadius={'2xl'}></Skeleton>
        }
      </Box>
    </Box>
  )
}

export default LiquidationConditions