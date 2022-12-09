import { useAppContext } from "../../components/Provider"
import { Box, Flex, Text, Grid, GridItem, useColorModeValue, Skeleton, TableContainer, Table, Tbody, Td, Th, Thead, Tr, Stack, Stat, StatArrow, StatGroup, StatHelpText, StatLabel, StatNumber, Image } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router'
import { useWeb3React } from "@web3-react/core";
import { fetchPosition, getGraphData } from "../../contractCalls/dataFetching";
import { fetchImportantPoints } from "../../contractCalls/dataFetching";
import { LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { Heading2 } from "../../components/Typography";
import { getLogoUrl, nFormatter } from "../../utils";

const Analytics = () => {
  const {contracts, chainId} = useAppContext()
  const {provider, account} = useWeb3React()
  const router = useRouter()
  const { id } = router.query
  const [position, setPosition] = useState(undefined)
  const [analytics, setAnalytics] = useState(undefined)
  const [roi, setRoi] = useState<string>()
  const [pnl, setPnl] = useState<string>()
  const [graphData, setGraphData] = useState(undefined)

  useEffect(() => {
    const fetch = async () => {
      const data = await getGraphData(contracts, id, provider, -1)
      setGraphData(data)
    }
    if (contracts && provider) {
      fetch()
    }
  }, [contracts, provider, id])

  useEffect(() => {
    const fetch = async () => {
      // @ts-ignore
      const position = await fetchPosition(parseInt(id), contracts, provider.getSigner(account), chainId)
      const positionData = await fetchImportantPoints(contracts, id, provider)
      const roi = positionData.usdcWithdrawn+position.usdcValue-positionData.usdcDeposited
      const pnl = roi*100/positionData.usdcDeposited
      setRoi(roi.toFixed(2))
      setPnl(pnl.toFixed(2))
      setAnalytics(positionData)
      setPosition(position)
    }
    if (contracts && provider) {
      fetch()
    }
  }, [contracts, provider, id])

  return (
    <Box maxWidth={'900px'} marginTop={'50px'} marginInline={'auto'}>
    <Box
      maxWidth={'100vw'}
      marginInline={'auto'}
      justifyContent={'space-between'}
      bg={useColorModeValue('white', 'gray.900')}
      boxShadow={'2xl'}
      rounded={'lg'}
      p={{base: 3, sm: 6, md: 10}}>
      <Grid gridTemplateColumns={{base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)'}} gap={'4'} mb={'6'}>
        <Stat display='flex' padding={'4'} backgroundColor='gray.100' borderRadius={'xl'}>
          <StatLabel fontSize={'l'}>Asset Value</StatLabel>
          {
            typeof(position?.usdcValue)==='number'?<StatNumber fontSize={{base: 'xl', md: '2xl'}}>${nFormatter(position?.usdcValue, 3)}</StatNumber>:
            <Skeleton>Temporary</Skeleton>
          }
        </Stat>
        <Stat display='flex' padding={'4'} backgroundColor='gray.100' borderRadius={'xl'}>
          <StatLabel fontSize={'l'}>PnL</StatLabel>
          <Flex>
          {
            roi?<Flex>
              <StatNumber fontSize={{base: 'xl', md: '2xl'}} mr={'3'}>${pnl}</StatNumber>
              <StatHelpText display={'flex'} alignItems={'end'} justifyContent={'start'}>
                <StatArrow type={+roi<0?'decrease':'increase'} />
                {roi}%
              </StatHelpText>
            </Flex>:
            <Skeleton>Temporary</Skeleton>
          }
          </Flex>
        </Stat>
        <Stat display='flex' padding={'4'} backgroundColor='gray.100' borderRadius={'xl'}>
          <StatLabel fontSize={'l'}>Projected APY</StatLabel>
          {
            typeof(position?.usdcValue)==='number'?<StatNumber fontSize={{base: 'xl', md: '2xl'}}>0%</StatNumber>:
            <Skeleton>Temporary</Skeleton>
          }
          
        </Stat>
        <Stat display='flex' padding={'4'} backgroundColor='gray.100' borderRadius={'xl'}>
          <StatLabel fontSize={'l'}>Advertised APY</StatLabel>
          Coming soon
        </Stat>
      </Grid>
      <Heading2>Historical Position Value</Heading2>
      <Box style={{ overflow: 'auto', maxWidth: '90vw'}} mt={'6'} mb={'12'}>
      {
        graphData?<Box>
        <LineChart width={800} height={400} data={graphData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" padding={{left: 10}}>
          </XAxis>
          <YAxis dataKey={"value"}>
          </YAxis>
          <Tooltip />
          {/* <Legend /> */}
          <Line type="monotone" dataKey="value" />
        </LineChart>
        </Box>:
        <Skeleton height={'300px'}></Skeleton>
      }
      </Box>
      <Grid
        w={'100%'}
        templateColumns={{base: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)'}}
        mb={'8'}
        gap={10}
      >
        <GridItem>
          <Heading2>Asset</Heading2>
          {
            position?
            <Flex alignItems={'center'}>
              <Image mr={'2'} rounded='xl' width='30px' height={'30px'} src={getLogoUrl(position?.name, position?.tokenContract, chainId)}></Image>
              <Box>
                <Text>{position?.name}</Text>
                <Text>{nFormatter(position?.positionData.amountDecimal||0, 2)} tokens (${nFormatter(position.usdcValue, 2)})</Text>
              </Box>
            </Flex>:
            <Skeleton width={'60%'} height='20px' />
          }
        </GridItem>
        <GridItem>
          <Heading2>Underlying Tokens</Heading2>
          {
            position?position.underlying.map((underlyingAsset)=>
            <Flex alignItems={'center'}>
              <Image mr={'2'} rounded={'xl'} width='30px' height={'30px'} src={getLogoUrl(underlyingAsset.name, underlyingAsset.address, chainId)}></Image>
              <Box mb={'2'}>
                <Flex alignItems='center'>
                  <Text>{underlyingAsset.name}</Text>
                </Flex>
                <Text>{nFormatter(underlyingAsset.amount, 2)} tokens (${nFormatter(underlyingAsset.value, 2)})</Text>
              </Box>
            </Flex>):
            <Stack>
              <Skeleton width={'60%'} height='20px' />
              <Skeleton width={'60%'} height='20px' />
            </Stack>
          }
        </GridItem>
        {
          position?.rewards.length>0?
          <GridItem>
            <Heading2>Underlying Rewards</Heading2>
            {
              position?position.rewards.map((reward)=>
              <Flex alignItems={'center'}>
                <Image mr={'2'} rounded={'xl'} width='30px' height={'30px'} src={getLogoUrl(reward.name, reward.address, chainId)}></Image>
                <Box mb={'2'}>
                  <Text>{reward.name}</Text>
                  <Text>{nFormatter(reward.amount, 2)} tokens (${nFormatter(reward.value, 2)})</Text>
                </Box>
              </Flex>):
              <Stack>
                <Skeleton width={'60%'} height='20px' />
                <Skeleton width={'60%'} height='20px' />
              </Stack>
            }
          </GridItem>
          :<></>
        }
      </Grid>
      <Heading2>Transactions</Heading2>
      <TableContainer mt={'6'}>
        <Table size='sm'>
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Transaction Type</Th>
              <Th>Tokens</Th>
              <Th>USD Value</Th>
            </Tr>
          </Thead>
          <Tbody>
            {
              analytics?.data.map((transaction)=> {
                return (
                  <Tr>
                    <Td>{transaction.date}</Td>
                    <Td>{transaction.action}</Td>
                    <Td>{nFormatter(transaction.sizeChange, 3)}</Td>
                    <Td>${nFormatter(transaction.usdValue, 3)}</Td>
                  </Tr>
                )
              })
            }
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
    </Box>
  )
}

export default Analytics