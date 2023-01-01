/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  env: {
    infuraKey: process.env.INFURA_KEY,
    alchemyKey: process.env.ALCHEMY_KEY,
    COVALENT_KEY: process.env.COVALENT_KEY,
    RPC_1: process.env.RPC_1,
    RPC_56: process.env.RPC_56,
    RPC_97: process.env.RPC_97,
  },
};

module.exports = nextConfig;
