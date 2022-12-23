/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  env: {
    infuraKey: process.env.INFURA_KEY,
    alchemyKey: process.env.ALCHEMY_KEY,
    COVALENT_KEY: process.env.COVALENT_KEY,
    1: process.env['1'],
    56: process.env['56'],
    97: process.env['97']
  },
}

module.exports = nextConfig
