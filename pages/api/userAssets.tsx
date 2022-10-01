import cacheData from "memory-cache";

export default async function serverSideCall(req, res) {
  const {
    query: { chainId, address },
  } = req;
  const baseUrl = `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/?quote-currency=USD&format=JSON&nft=true&no-nft-fetch=false&key=${process.env.COVALENT_KEY}`;
  const value = cacheData.get(baseUrl)
  if (value) {
    res.status(200).json({
      data: value,
    })
  } else {
    const hours = 24;
    const response = await fetch(baseUrl);
    const data = await response.json();
    cacheData.put(baseUrl, data.data, hours * 1000 * 60 * 60);
    res.status(200).json({
      data: data.data,
    })
  }
}