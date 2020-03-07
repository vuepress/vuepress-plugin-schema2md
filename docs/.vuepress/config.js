const { join, resolve } = require('path')
const pkg = require('../../package')

module.exports = {
  title: pkg.name,
  description: pkg.description,
  additionalPages: [
    {
      path: '/',
      filePath: resolve(__dirname, '../../README.md')
    },
  ],
  themeConfig: {
    nav: [
      { text: 'foo.config.js', link: '/config/' },
    ],
  },
  plugins: [
    [require('../../lib'), {
      cwd: __dirname,
      pages: {
        '/config/': {
          schemaPath: 'schemas/schema.json'
        }
      }
    }]
  ],
}
