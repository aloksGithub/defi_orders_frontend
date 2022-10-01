export default async function serverSideCall(req, res) {
  const {
    query: { chainId, address },
  } = req;
  for (let i = 0; i<5; i++) {
    try {
      const baseUrl = `https://api.covalenthq.com/v1/pricing/historical_by_addresses_v2/${chainId}/USD/${address}/?quote-currency=USD&format=JSON&key=${process.env.COVALENT_KEY}`;
      const response = await (await fetch (baseUrl)).json();
      console.log(response)
      const price = response.data[0].items[0].price
      const name = response.data[0].items[0].contract_metadata.contract_name
      const decimals = response.data[0].items[0].contract_metadata.contract_decimals
      res.status(200).json({
        data: {price, name, decimals},
      });
      return
    } catch (err) {
      console.log(`Failed attempt ${i} to fetch token price. Error: ${err}`)
      continue
    }
  }
}