import { Connector } from '@web3-react/types'
import { BigNumber } from 'ethers';
import { ReactElement } from 'react'
import { PositionManager, UniversalSwap, BankBase, ERC20, UniswapV3PoolInteractor } from './codegen';

export type SupportedChains = 56|1

interface AssetUnderlying {
  contract_name: string;
  contract_ticker_symbol: string;
  contract_address: string;
  contract_decimals: number;
  logo_url: string;
}

export interface Asset {
  contract_name: string|undefined;
  contract_ticker_symbol: string|undefined;
  contract_address: string|undefined;
  contract_decimals: number|undefined;
  underlying: AssetUnderlying[]
  logo_url: string|undefined;
  protocol_name: string|undefined;
  chain_id: number|undefined;
  manager?: string|undefined;
}

export const defaultAsset:Asset = {
  contract_name: undefined,
  contract_ticker_symbol: undefined,
  contract_address: undefined,
  contract_decimals: undefined,
  underlying: [],
  logo_url: undefined,
  protocol_name: undefined,
  chain_id: undefined,
  manager: undefined
}

export interface UserAsset extends Asset {
  quote: number|undefined
  quote_rate: number|undefined
  balance: string|undefined
  formattedBalance: number|undefined
}

export interface UserAssetSupplied extends Asset, UserAsset {
  usdcValue?: number|undefined
  tokensSupplied?: number|undefined
}

export const defaultUserAssetSupplied: UserAssetSupplied = {
  contract_name: undefined,
  contract_ticker_symbol: undefined,
  contract_address: undefined,
  contract_decimals: undefined,
  underlying: [],
  logo_url: undefined,
  protocol_name: undefined,
  chain_id: undefined,
  quote: 0,
  quote_rate: 0,
  balance: '0',
  formattedBalance: 0,
  usdcValue: 0,
  tokensSupplied: 0,
}

export interface WantedAsset extends Asset {
  percentage: number
  expected: number
  minOut: number
  price: number
  quote?: number
}

export const defaultWantedAsset: WantedAsset = {
  contract_name: undefined,
  contract_ticker_symbol: undefined,
  contract_address: undefined,
  contract_decimals: undefined,
  underlying: [],
  logo_url: undefined,
  protocol_name: undefined,
  chain_id: undefined,
  percentage: 0,
  expected: 0,
  minOut: 0,
  price: 0,
  quote: 0
}

export interface LiquidationCondition {
  convertTo: Asset
  lessThan: boolean
  liquidationPoint: number
  slippage: number
  watchedAsset: Asset
}

export const defaultLiquidationCondition: LiquidationCondition = {
  convertTo: defaultAsset,
  lessThan: false,
  liquidationPoint: 0,
  slippage: 0,
  watchedAsset: defaultAsset

}

export interface Contracts {positionManager: PositionManager, universalSwap: UniversalSwap, banks: BankBase[], stableToken: ERC20}

export interface ContextType {
  userAssets: {data: UserAsset[], loading: boolean, error: boolean}
  hardRefreshAssets: Function
  softRefreshAssets: Function
  account: undefined|string
  chainId: undefined|number
  connector: undefined|Connector
  supportedAssets: Asset[]
  contracts: Contracts | undefined
  slippageControl: {slippage: number, setSlippage: (slippage:number)=>void}
  counter: number
  onError: (error:Error)=>void
  successModal: (title:string, body:ReactElement)=>void
}

export const defaultContext: ContextType = {
  userAssets: {data: [], loading: true, error: false},
  hardRefreshAssets: ()=>{},
  softRefreshAssets: ()=>{},
  account: undefined,
  chainId: undefined,
  connector: undefined,
  supportedAssets: [],
  contracts: undefined,
  slippageControl: {slippage: 0.5, setSlippage: function (slippage:number){}},
  counter: 0,
  onError: (error:Error)=>{},
  successModal: (title:string, body:ReactElement)=>{}
}