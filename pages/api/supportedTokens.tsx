import cacheData from "memory-cache";
import supportedProtocols from '../../constants/supportedProtocols.json'

const getAssets = async (url: string, query: string, protocol: string, manager:string) => {
  for (let i =0; i<5; i++) {
    try {
      const res = await (await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })).json()
      if ('tokens' in res.data) {
        return res.data.tokens.map(token=>{
          return {
            value: token.id,
            label: token.symbol,
            manager
          }
        })
      } else if ('pairs' in res.data) {
        const formattedAssets = res.data.pairs.map(asset=> {
          if (protocol==='Uniswap V3') {
            return {
              value: asset.id,
              label: `${protocol} ${asset.token0.symbol}-${asset.token1.symbol} (${+asset.feeTier/10000}%) LP`,
              manager
            }
          }
          return {
            value: asset.id,
            label: `${protocol} ${asset.token0.symbol}-${asset.token1.symbol} LP`,
            manager
          }
        })
        return formattedAssets
      } else if ('pools' in res.data) {
        const formattedAssets = res.data.pools.map(asset=> {
          if (protocol==='Uniswap V3') {
            return {
              value: asset.id,
              label: `${protocol} ${asset.token0.symbol}-${asset.token1.symbol} (${+asset.feeTier/10000}%) LP`,
              manager
            }
          }
          return {
            value: asset.id,
            label: `${protocol} ${asset.token0.symbol}-${asset.token1.symbol} LP`,
            manager
          }
        })
        return formattedAssets
      } else if ('markets' in res.data) {
        const formattedAssets = res.data.pools.map(asset=> {
          return {
            value: asset.id,
            label: asset.name,
            manager
          }
        })
        return formattedAssets
      }
      return res.data
    } catch {
      continue
    }
  }
}

export default async function serverSideCall(req, res) {
  const {
    query: { chainId },
  } = req;
    const value = cacheData.get("SupportedAssets")
  if (value) {
    res.status(200).json({
      data: value,
    })
  } else {
    const hours = 24;
    const protocols = supportedProtocols[chainId]
    const assets = {}
    for (const protocol of protocols) {
      const data = await getAssets(protocol.url, protocol.query, protocol.name, protocol.manager)
      assets[protocol.name] = data
    }
    cacheData.put("SupportedAssets", assets, hours * 1000 * 60 * 60);
    res.status(200).json({
      data: assets,
    })
  }
}