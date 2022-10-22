import { useAppContext } from "../../components/Provider"
import { Box, Flex, Text, Grid, GridItem, useColorModeValue, Skeleton, TableContainer, Table, Tbody, Td, Th, Thead, Tr, Stack, Stat, StatArrow, StatGroup, StatHelpText, StatLabel, StatNumber } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router'
import { useWeb3React } from "@web3-react/core";
import { fetchPosition, getGraphData } from "../../contractCalls/dataFetching";
import { fetchImportantPoints } from "../../contractCalls/dataFetching";
import { LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { Heading2 } from "../../components/Typography";

const Analytics = () => {
  const {contracts} = useAppContext()
  const {provider, account} = useWeb3React()
  const router = useRouter()
  const { id } = router.query
  const [position, setPosition] = useState(undefined)
  const [analytics, setAnalytics] = useState(undefined)
  const [roi, setRoi] = useState<string>()
  const [pnl, setPnl] = useState<string>()
  const [graphData, setGraphData] = useState(undefined)

  console.log(graphData)

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
      const position = await fetchPosition(parseInt(id), contracts, provider.getSigner(account))
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
    <Flex>
    <Box
      maxWidth={'100vw'}
      marginInline={'auto'}
      marginBlock={'10'}
      justifyContent={'space-between'}
      bg={useColorModeValue('white', 'gray.900')}
      boxShadow={'2xl'}
      rounded={'lg'}
      p={10}>
      <StatGroup mb={'10'}>
        <Stat>
          <StatLabel fontSize={'l'}>Asset Value</StatLabel>
          <StatNumber fontSize={{base: 'xl', md: '2xl'}}>${position?.usdcValue.toFixed(3)}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel fontSize={'l'}>PnL</StatLabel>
          <Flex direction={{base: 'column', md: 'row'}} >
          <StatNumber fontSize={{base: 'xl', md: '2xl'}} mr={'3'}>${pnl}</StatNumber>
          <StatHelpText display={'flex'} alignItems={'end'} justifyContent={'start'}>
            <StatArrow type={+roi<0?'decrease':'increase'} />
            {roi}%
          </StatHelpText>
          </Flex>
        </Stat>
        <Stat>
          <StatLabel fontSize={'l'}>Projected APY</StatLabel>
          <StatNumber fontSize={{base: 'xl', md: '2xl'}}>0%</StatNumber>
        </Stat>
      </StatGroup>
      <Heading2>Historical Position Value</Heading2>
      <Box style={{ overflow: 'auto', maxWidth: '80vw'}} mt={'6'} mb={'12'}>
      {
        graphData?<Box>
        <LineChart width={500} height={300} data={graphData}>
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
        gridTemplateRows={'80px'}
        templateColumns='repeat(3, 1fr)'
        mb={'8'}
        gap={10}
      >
        <GridItem colSpan={1}>
          <Heading2>Asset</Heading2>
          {
            position?<Text>{position?.name}</Text>:
            <Skeleton width={'60%'} height='20px' />
          }
          
        </GridItem>
        <GridItem colSpan={1}>
          <Heading2>Underlying Tokens</Heading2>
          {
            position?position.underlying.map((token)=> <Text>{token}</Text>):
            <Stack>
              <Skeleton width={'60%'} height='20px' />
              <Skeleton width={'60%'} height='20px' />
            </Stack>
          }
        </GridItem>
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
                    <Td>{transaction.transactionType}</Td>
                    <Td>{transaction.tokens}</Td>
                    <Td>${transaction.usdc.toFixed(5)}</Td>
                  </Tr>
                )
              })
            }
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
    </Flex>
  )
}

export default Analytics