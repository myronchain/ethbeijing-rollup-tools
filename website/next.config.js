const path = require('path')

module.exports = {
  trailingSlash: true,
  reactStrictMode: false,
  async rewrites() {
    return [
      // {
      //   source: '/:path*',
      //   destination: '/bridge',
      // },
    ];
  },
  experimental: {
    esmExternals: false
    // jsconfigPaths: true // enables it for both jsconfig.json and tsconfig.json
  },
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision')
    }

    config.resolve.fallback = {
      ...config.resolve.fallback, // if you miss it, all the other options in fallback, specified
        // by next.js will be dropped. Doesn't make much sense, but how it is
      fs: false, // the solution
    };
    // config.module.rules.push({
    //   test: /\.svg$/i,
    //   issuer: /\.[jt]sx?$/,
    //   use: ['@svgr/webpack'],
    // })

    return config
  }
}
