export default async function serverSideCall(req, res) {
    const {
      query: { chainId, address },
    } = req;
    const baseUrl = `https://api.covalenthq.com/v1/${chainId}/address/${address}/balances_v2/?quote-currency=USD&format=JSON&nft=true&no-nft-fetch=false&key=${process.env.COVALENT_KEY}`;
    const response = await (await fetch (baseUrl)).json();
    res.status(200).json({
    data: response.data,
  });
}