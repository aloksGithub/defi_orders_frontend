import supportedProtocols from '../../constants/supportedProtocols.json'
import { chainLogos, getLogoUrl, nativeTokens } from "../../utils";
const fs = require('fs');

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

const dataExtractorERC20 = (data, chainId, protocol, manager) => {
  const assets = data.tokens.map(token=> {
    return {
      contract_name: token.name,
      contract_address: token.id,
      contract_ticker_symbol: token.symbol,
      contract_decimals: token.decimals,
      underlying: [],
      logo_url: `https://logos.covalenthq.com/tokens/${chainId}/${token.id}.png`,
      manager
    }
  })
  assets.unshift({...nativeTokens[chainId]})
  return assets
}

const dataExtractorUniV2 = (data, chainId, protocol, manager) => {
  const assets = data.pairs.map(asset=> {
    return {
      contract_name: `${protocol} ${asset.token0.symbol}-${asset.token1.symbol} LP`,
      contract_address: asset.id,
      contract_ticker_symbol: protocolSymbols[protocol],
      contract_decimals: 18,
      underlying: [
        {
          contract_name: asset.token0.name,
          contract_address: asset.token0.id,
          contract_ticker_symbol: asset.token0.symbol,
          contract_decimals: asset.token0.decimals,
          logo_url: `https://logos.covalenthq.com/tokens/${chainId}/${asset.token0.id}.png`
        },
        {
          contract_name: asset.token1.name,
          contract_address: asset.token1.id,
          contract_ticker_symbol: asset.token1.symbol,
          contract_decimals: asset.token1.decimals,
          logo_url: `https://logos.covalenthq.com/tokens/${chainId}/${asset.token1.id}.png`
        }
      ],
      logo_url: logos[protocol],
      manager
    }
  })
  return assets
}

const dataExtractorUniV3 = (data, chainId, protocol, manager) => {
  const assets = data.pools.map(asset=> {
    return {
      contract_name: `${protocol} ${asset.token0.symbol}-${asset.token1.symbol} (${+asset.feeTier/10000}%) LP`,
      contract_address: asset.id,
      contract_ticker_symbol: `UNI-V3`,
      contract_decimals: 18,
      underlying: [
        {
          contract_name: asset.token0.name,
          contract_address: asset.token0.id,
          contract_ticker_symbol: asset.token0.symbol,
          contract_decimals: asset.token0.decimals,
          logo_url: `https://logos.covalenthq.com/tokens/${chainId}/${asset.token0.id}.png`},
        {
          contract_name: asset.token1.name,
          contract_address: asset.token1.id,
          contract_ticker_symbol: asset.token1.symbol,
          contract_decimals: asset.token1.decimals,
          logo_url: `https://logos.covalenthq.com/tokens/${chainId}/${asset.token1.id}.png`}
      ],
      logo_url: logos[protocol],
      manager
    }
  })
  return assets
}

const dataExtractorVenus = (data, chainId, protocol, manager) => {
  const assets = data.markets.map(asset=> {
    return {
      contract_name: asset.name,
      contract_address: asset.id,
      contract_ticker_symbol: asset.symbol,
      contract_decimals: 18,
      underlying: [{
        contract_name: asset.underlyingName,
        contract_address: asset.underlyingAddress,
        contract_ticker_symbol: asset.underlyingSymbol,
        contract_decimals: asset.underlyingDecimals,
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
      contract_name: asset.outputToken.name,
      contract_address: asset.outputToken.id,
      contract_ticker_symbol: `a${asset.inputToken.symbol}`,
      contract_decimals: asset.inputToken.decimals,
      unedrlying: [{
        contract_name: asset.inputToken.name,
        contract_address: asset.inputToken.id,
        contract_ticker_symbol: asset.inputToken.symbol,
        contract_decimals: asset.inputToken.decimals,
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
      const fileData = JSON.stringify({data: assets, timeOut: Date.now()+timeOut})
      if (fs.existsSync(`./protocolData`)) {
        fs.writeFileSync(`./protocolData/${protocol}_${chainId}.json`, fileData)
      } else {
        fs.writeFileSync(`../../protocolData/${protocol}_${chainId}.json`, fileData)
      }
      // fs.writeFileSync(`./protocolData/${protocol}_${chainId}.json`, fileData)
      return assets
    } catch (error) {
      console.log(error)
      continue
    }
  }
}

const timeOut = 1000*60*60*24 // Expire cahced supported assets after a day

const processRequest = async (chainId: string) => {
  const protocols = supportedProtocols[chainId]
  const assets = {}
  for (const protocol of protocols) {
    if (fs.existsSync(`./protocolData/${protocol.name}_${chainId}.json`)) {
      const {data, timeOut} = JSON.parse(fs.readFileSync(`./protocolData/${protocol.name}_${chainId}.json`, 'utf8'))
      const timeNow = Date.now()
      if (timeNow>timeOut) {
        getAssets(protocol.url, protocol.query, protocol.name, protocol.manager, +chainId)
      }
      assets[protocol.name] = data
    } else if (fs.existsSync(`../../protocolData/${protocol.name}_${chainId}.json`)) {
      const {data, timeOut} = JSON.parse(fs.readFileSync(`../../protocolData/${protocol.name}_${chainId}.json`, 'utf8'))
      const timeNow = Date.now()
      if (timeNow>timeOut) {
        getAssets(protocol.url, protocol.query, protocol.name, protocol.manager, +chainId)
      }
      assets[protocol.name] = data

    }
    else {
      const data = await getAssets(protocol.url, protocol.query, protocol.name, protocol.manager, +chainId)
      assets[protocol.name] = data
    }
  }
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