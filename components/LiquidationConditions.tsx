import { MinusIcon, AddIcon, DeleteIcon } from "@chakra-ui/icons"
import { TableContainer, Table, Thead, Tr, Th, Tbody, Text, Td, Flex, NumberInput, NumberInputField, Button, useDisclosure, Box, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Skeleton, Center, Grid } from "@chakra-ui/react"
import {Select} from "chakra-react-select";
import { ethers } from "ethers"
import { forwardRef, useEffect, useState, useImperativeHandle } from "react"
import { useAppContext } from "./Provider"
import { Heading3 } from "./Typography";
import { SelectAsset } from "./selectAssets";
import { getPrice } from "../utils";
import { AiOutlineReload } from "react-icons/ai";

const Condition = ({i, condition, setWatchedAsset, setConvertTo, removeAsset, setLiquidationPoint, setPrice}) => {
  const {supportedAssets, chainId} = useAppContext()
  const self = {
    value: ethers.constants.AddressZero,
    label: 'Value of self',
    contract_name: 'Value of self',
    contract_ticker_symbol: 'Self',
    contract_address: ethers.constants.AddressZero,
    underlying:[],
    logo_url: 'https://www.svgrepo.com/show/99387/dollar.svg'
  }

  const onSelectWatched = (asset) => {
    if (asset.contract_address!=ethers.constants.AddressZero) {
      getPrice(chainId, asset.contract_address).then(price=>setPrice(price))
    }
    setWatchedAsset(asset)
  }

  const onSelectConvertTo = (asset) => {
    setConvertTo(asset)
  }

  return (
    <Flex marginBlock={'2'} padding={'4'} borderRadius={'2xl'} backgroundColor={'#f7f7f7'} justifyContent='space-between' minWidth={'400px'} width={'100%'}>
      <Box marginBlock={'auto'}>
        <Flex mb={'4'}>
          {/* @ts-ignore */}
          <SelectAsset asset={condition.watchedAsset} onSelect={onSelectWatched} assets={[self, ...supportedAssets.ERC20]} placeHolder={'Watched price'}/>
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
          <Text mt={'3'}>Current Price: ${(+(condition.price)||0).toFixed(3)}</Text>
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
const LiquidationConditions = ({assetPrice, initialLiquidationPoints=undefined, liquidationPoints, onChangeConditions, resetFlag}) => {
  useEffect(()=> {
    if (initialLiquidationPoints) {
      onChangeConditions(JSON.parse(JSON.stringify(initialLiquidationPoints)))
    }
  }, [resetFlag, initialLiquidationPoints])

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

  const setWatchedAsset = (index, asset) => {
    const temp = [...liquidationPoints]
    temp[index].watchedAsset = asset
    if (asset.contract_address===ethers.constants.AddressZero) {
      temp[index].price=assetPrice
    }
    if (temp[index].liquidationPoint<temp[index].price) {
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

  const setPrice = (index, price) => {
    const temp = [...liquidationPoints]
    temp[index].price = price
    if (+temp[index].liquidationPoint<+price) {
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
          <Flex alignItems={'center'} p={'2'} borderRadius={'lg'} mr={'3'} backgroundColor={'gray.100'} _hover={{cursor:'pointer', backgroundColor: 'gray.300'}}>
          <AiOutlineReload fontSize={'1.2rem'}></AiOutlineReload>
          </Flex>
          <Button onClick={addCondition} paddingInline={'4'} colorScheme={'blue'}><AddIcon/></Button>
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
              setPrice={(price)=>setPrice(index, price)}/>
          )}):<Skeleton minWidth={'500px'} height='140' marginBlock={'2'} padding={'4'} borderRadius={'2xl'}></Skeleton>
        }
      </Box>
    </Box>
  )
}

export default LiquidationConditions