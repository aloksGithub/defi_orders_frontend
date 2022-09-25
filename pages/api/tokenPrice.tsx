export default async function serverSideCall(req, res) {
    const {
      query: { chainId, address },
    } = req;
    const baseUrl = `https://api.covalenthq.com/v1/pricing/historical_by_addresses_v2/${chainId}/USD/${address}/?quote-currency=USD&format=JSON&key=${process.env.COVALENT_KEY}`;
    const response = await (await fetch (baseUrl)).json();
    res.status(200).json({
    data: {
      price: response.data[0].items[0].price,
      name: response.data[0].items[0].contract_metadata.contract_name,
      decimals: response.data[0].items[0].contract_metadata.contract_decimals
    },
  });
}