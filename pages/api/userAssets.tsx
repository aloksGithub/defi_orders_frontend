import { ethers } from "ethers";
import { UserAsset } from "../../Types";
import { getPriceActual, getPriceUniversalSwap } from "./tokenPrice";
import { fetchTokenDetails } from "./tokenPrice";

export default async function serverSideCall(req, res) {
  const {
    query: { chainId, address },
  } = req;
  const baseUrl = `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/?quote-currency=USD&format=JSON&nft=true&no-nft-fetch=false&key=${process.env.COVALENT_KEY}`;
  const response = await fetch(baseUrl);
  let data = await response.json();
  data = data.data?.items?.map((item) =>
    ["0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", "0xtzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"].includes(
      item.contract_address
    )
      ? { ...item, contract_address: ethers.constants.AddressZero }
      : item
  );
  if (data) {
    data = data.map((item) =>
      item.contract_ticker_symbol === "SLP" ? { ...item, contract_ticker_symbol: "Sushi LP" } : item
    );
    data = data.filter((item) => {
      const data = fetchTokenDetails(chainId, item.contract_address);
      if (!data) {
        return false;
      }
      return true;
    });
    let modifiedItems: UserAsset[] = await Promise.all(
      data.map(async (item) => {
        const tokenData = fetchTokenDetails(chainId, item.contract_address);
        const { price } = await getPriceUniversalSwap(chainId, item.contract_address);
        // let price: number
        // if (['Pancake LPs', 'Biswap LPs', 'SushiSwap LP Token', 'Uniswap V2'].includes(item.contract_name)) {
        //   price = await getPriceActual(chainId, item.contract_address)
        // } else {
        //   price = +item.quote_rate
        // }
        const corrected = {
          ...tokenData,
          quote: +ethers.utils.formatUnits(item.balance, item.contract_decimals) * price,
          quote_rate: price,
          formattedBalance: ethers.utils.formatUnits(item.balance, item.contract_decimals),
          balance: item.balance,
        };
        return corrected;
      })
    );
    modifiedItems = modifiedItems.filter((item) => item.quote > 0);
    res.status(200).json({
      data: { items: modifiedItems },
    });
  } else {
    res.status(200).json({
      data: { items: [] },
    });
  }
}
