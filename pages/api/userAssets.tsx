import { ethers } from "ethers";
import { getPriceActual } from "./tokenPrice";
import { fetchTokenDetails } from "./tokenPrice";

export default async function serverSideCall(req, res) {
  const {
    query: { chainId, address },
  } = req;
  const baseUrl = `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/?quote-currency=USD&format=JSON&nft=true&no-nft-fetch=false&key=${process.env.COVALENT_KEY}`;
  const response = await fetch(baseUrl);
  const data = await response.json();
  let modifiedItems = data.data?.items?.map(item=>
    ["0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", "0xtzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"]
    .includes(item.contract_address)?{...item, contract_address:ethers.constants.AddressZero}:item)
  if (modifiedItems) {
    modifiedItems = modifiedItems.map(item=> item.contract_ticker_symbol==='SLP'?{...item, contract_ticker_symbol:'Sushi LP'}:item)
    modifiedItems = modifiedItems.filter(item=>{
      const data = fetchTokenDetails(chainId, item.contract_address)
      if (!data) {
        return false
      }
      return true
    })
    modifiedItems = modifiedItems.map(async item=> {
      if (['Pancake LPs', 'Biswap LPs', 'SushiSwap LP Token', 'Uniswap V2'].includes(item.contract_name)) {
        const price = await getPriceActual(chainId, item.contract_address, item.contract_decimals, item.contract_name)
        const corrected = {...item, quote: (+ethers.utils.formatUnits(item.balance, item.contract_decimals))*price}
        return corrected
      } else {
        return item
      }
    })
    modifiedItems = await Promise.all(modifiedItems)
    modifiedItems = modifiedItems.map(item=> {
      const data = fetchTokenDetails(chainId, item.contract_address)
      return {...item, contract_name: data.contract_name, underlying: data.underlying, logo_url: data.logo_url?data.logo_url:item.logo_url}
    })
    modifiedItems = modifiedItems.filter(item=>item.quote>0)
    res.status(200).json({
      data: {items: modifiedItems},
    })
  } else {
    res.status(200).json({
      data: {items: []},
    })
  }
}