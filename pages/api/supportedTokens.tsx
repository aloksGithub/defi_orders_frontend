import { ethers } from "ethers";
import cacheData from "memory-cache";
import supportedProtocols from '../../constants/supportedProtocols.json'
import { chainLogos, getLogoUrl } from "../../utils";

const getTokenUrl = (chainId:number, token:string) => {
  const defaultUrl = `https://logos.covalenthq.com/tokens/${chainId}/${token}.png`
  var request = new XMLHttpRequest();
  request.open("GET", defaultUrl, true);
  request.send();
  request.onload = function() {
    if (request.status == 200) //if(statusText == OK)
    {
      return defaultUrl
    } else {
      return 'https://www.svgrepo.com/show/99387/dollar.svg'
    }
  }
}

const getPrice = async (chainId:number, address:string) => {
  for (let i = 0; i<5; i++) {
    try {
      const baseUrl = `https://api.covalenthq.com/v1/pricing/historical_by_addresses_v2/${chainId}/USD/${address}/?quote-currency=USD&format=JSON&key=${process.env.COVALENT_KEY}`;
      const response = await (await fetch (baseUrl)).json();
      return response
    } catch (err) {
      console.log(`Failed attempt ${i} to fetch token price. Error: ${err}`)
      continue
    }
  }
}

const logos = {
  Pancakeswap: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.svg?v=023',
  Biswap: 'https://cryptologos.cc/logos/biswap-bsw-logo.svg?v=023',
  'Uniswap V2': 'https://cryptologos.cc/logos/uniswap-uni-logo.svg?v=023',
  'Uniswap V3': 'https://cryptologos.cc/logos/uniswap-uni-logo.svg?v=023',
  Sushiswap: 'https://cryptologos.cc/logos/sushiswap-sushi-logo.svg?v=023',
  AAVE: 'https://cryptologos.cc/logos/aave-aave-logo.svg?v=023',
}

const protocolSymbols = {
  Pancakeswap: 'Pancake LP',
  Biswap: 'Biswap LP',
  'Uniswap V2': 'Uniswap LP',
  Sushiswap: 'Sushi LP',

}

const nativeTokens = {
  56: {
    contract_name: 'BNB',
    underlying: [],
    logo_url: chainLogos[56]
  },
  1: {
    contract_name: 'Ether',
    underlying: [],
    logo_url: chainLogos[1]
  },
  137: {
    contract_name: 'Matic',
    underlying: [],
    logo_url: chainLogos[137]
  },
  250: {
    contract_name: 'Fantom',
    underlying: [],
    logo_url: chainLogos[250]
  },
}

const dataExtractorERC20 = (data, chainId, protocol, manager) => {
  const assets = data.tokens.map(token=> {
    return {
      value: token.id,
      label: token.symbol,
      contract_name: token.name,
      contract_address: token.id,
      contract_ticker_symbol: token.symbol,
      decimals: token.decimals,
      logo_url: `https://logos.covalenthq.com/tokens/${chainId}/${token.id}.png`,
      underlying: [],
      manager
    }
  })
  return assets
}

const dataExtractorUniV2 = (data, chainId, protocol, manager) => {
  const assets = data.pairs.map(asset=> {
    return {
      value: asset.id,
      label: `${protocol} ${asset.token0.symbol}-${asset.token1.symbol} LP`,
      contract_name: `${protocol} ${asset.token0.symbol}-${asset.token1.symbol} LP`,
      contract_address: asset.id,
      contract_ticker_symbol: protocolSymbols[protocol],
      underlying: [{
        address: asset.token0.id, symbol: asset.token0.symbol, decimals: asset.token0.decimals, name: asset.token0.name, logo_url: `https://logos.covalenthq.com/tokens/${chainId}/${asset.token0.id}.png`},
        {address: asset.token1.id, symbol: asset.token1.symbol, decimals: asset.token1.decimals, name: asset.token1.name, logo_url: `https://logos.covalenthq.com/tokens/${chainId}/${asset.token1.id}.png`
      }],
      logo_url: logos[protocol],
      manager
    }
  })
  return assets
}

const dataExtractorUniV3 = (data, chainId, protocol, manager) => {
  const assets = data.pools.map(asset=> {
    return {
      value: asset.id,
      label: `${protocol} ${asset.token0.symbol}-${asset.token1.symbol} (${+asset.feeTier/10000}%) LP`,
      contract_name: `${protocol} ${asset.token0.symbol}-${asset.token1.symbol} (${+asset.feeTier/10000}%) LP`,
      contract_address: asset.id,
      underlying: [
        {address: asset.token0.id, symbol: asset.token0.symbol, decimals: asset.token0.decimals, name: asset.token0.name, logo_url: `https://logos.covalenthq.com/tokens/${chainId}/${asset.token0.id}.png`},
        {address: asset.token1.id, symbol: asset.token1.symbol, decimals: asset.token1.decimals, name: asset.token1.name, logo_url: `https://logos.covalenthq.com/tokens/${chainId}/${asset.token1.id}.png`}
      ],
      contract_ticker_symbol: `UNI-V3`,
      logo_url: logos[protocol],
      manager
    }
  })
  return assets
}

const dataExtractorVenus = (data, chainId, protocol, manager) => {
  const assets = data.markets.map(asset=> {
    return {
      value: asset.id,
      label: asset.name,
      contract_name: asset.name,
      contract_ticker_symbol: asset.symbol,
      contract_address: asset.id,
      underlying: [{
        address: asset.underlyingAddress,
        symbol: asset.underlyingSymbol,
        name: asset.underlyingName,
        decimals: asset.underlyingDecimals,
        logo_url: `https://logos.covalenthq.com/tokens/${chainId}/${asset.underlyingAddress}.png`
      }],
      logo_url: getLogoUrl(asset.name, asset.id, chainId),
      manager
    }
  })
  return assets
}

const dataExtractorAAVE = (data, chainId, protocol, manager) => {
  const assets = data.markets.map(asset=> {
    return {
      value: asset.outputToken.id,
      label: asset.outputToken.name,
      contract_name: asset.outputToken.name,
      contract_address: asset.outputToken.id,
      unedrlying: [{
        address: asset.inputToken.id,
        symbol: asset.inputToken.symbol,
        name: asset.inputToken.name,
        decimals: asset.inputToken.decimals,
        logo_url: `https://logos.covalenthq.com/tokens/${chainId}/${asset.inputToken.id}.png`
      }],
      logo_url: logos[protocol],
      manager
    }
  })
  return assets
}

const dataExtractors = {
  'ERC20': dataExtractorERC20,
  'Uniswap V2': dataExtractorUniV2,
  'Sushiswap': dataExtractorUniV2,
  'Pancakeswap': dataExtractorUniV2,
  'Biswap': dataExtractorUniV2,
  'Uniswap V3': dataExtractorUniV3,
  'Venus': dataExtractorVenus,
  'AAVE': dataExtractorAAVE
}

const getAssets = async (url: string, query: string, protocol: string, manager:string, chainId:number) => {
  for (let i =0; i<5; i++) {
    try {
      const res = await (await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })).json()
      const dataExtractor = dataExtractors[protocol]
      const assets = dataExtractor(res.data, chainId, protocol, manager)
      for (const asset of assets) {
        cacheData.put(`${chainId}_${asset.value}`, asset)
      }
      return await Promise.all(assets)
    } catch (error) {
      // console.log(error)
      continue
    }
  }
}

const timeOut = 1000*60*60*24 // Expire cahced supported assets after a day

const processRequest = async (chainId: string) => {
  const protocols = supportedProtocols[chainId]
  const assets = {}
  for (const protocol of protocols) {
    const value = cacheData.get(`${protocol.name}_${chainId}`)
    if (!value) {
      const data = await getAssets(protocol.url, protocol.query, protocol.name, protocol.manager, +chainId)
      if (data) {
        assets[protocol.name] = data
        cacheData.put(`${protocol.name}_${chainId}`, {data, timeOut: Date.now()+timeOut});
      } else {
        console.log(`Failed to fetch data for ${protocol.name}`)
      }
    } else {
      const timeNow = Date.now()
      if (timeNow>value.timeOut) {
        getAssets(protocol.url, protocol.query, protocol.name, protocol.manager, +chainId).then(data=> {
          if (data) {
            cacheData.put(`${protocol.name}_${chainId}`, {data, timeOut: Date.now()+timeOut});
          } else {
            console.log(`Failed to fetch data for ${protocol.name}`)
          }
        })
      }
      assets[protocol.name] = value.data
    }
  }
  cacheData.put(`${chainId}_${ethers.constants.AddressZero}`, nativeTokens[chainId])
  return assets
}

export default async function serverSideCall(req, res) {
  const {
    query: { chainId },
  } = req;
  const assets = await processRequest(chainId)
  res.status(200).json({
    data: assets,
  })
}