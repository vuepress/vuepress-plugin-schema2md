/**
 * vuepress-plugin-schema2md © 2016-2020
 * @author ulivz
 * @date March.7th, 2020
 */

const { transform, batchTransform, normalizePath, resolveSchemaMarkdownPath } = require('schema2md')
const { watch } = require('chokidar')
const { cyan } = require('chalk')
const { logger, fs } = require('@vuepress/shared-utils')

let watcher

module.exports = (options, ctx) => {
  /**
   * Watch scheme file and emit the temp markdown file when it's changed.
   *
   * @param {object} paths
   * @param {function} callback
   */
  function addSchemaListener(paths, callback) {
    if (watcher) {
      return
    }

    const watchPaths = paths.reduce((memo, p) => {
      memo.push(p.schemaPath)
      memo.push(p.schemaMarkdownPath)
      return memo
    }, [])

    watcher = watch(watchPaths, {
      ignoreInitial: true
    })

    const handleSchemaChange = (schemaPath) => {
      let target
      if (schemaPath.endsWith('.json')) {
        target = paths.find(p => p.schemaPath === schemaPath)
      } else {
        target = paths.find(p => p.schemaMarkdownPath === schemaPath)
      }

      const sitePath = target.sitePath
      const targetPage = ctx.pages.find(page => page.path === sitePath)
      if (targetPage) {
        const { _filePath } = targetPage
        return {
          sitePath,
          filePath: _filePath,
          schemaPath
        }
      }
    }

    watcher.on('change', (schemaPath) => {
      logger.tip(`[schema2md] ${cyan(schemaPath)} changed`)
      const ret = handleSchemaChange(schemaPath)
      callback(ret)
    })

    watcher.on('unlink', (schemaPath) => {
      logger.tip(`[schema2md] ${cyan(schemaPath)} removed`)
      const ret = handleSchemaChange(schemaPath)
      fs.removeSync(ret.filePath)
    })
  }

  return {
    async additionalPages() {
      const { cwd = process.cwd(), locale, write = false, pages } = options
      const pagePaths = Object.keys(pages)
      const configs = pagePaths.map(p => pages[p])

      const schemaPaths = pagePaths.map(p => {
        const abSchemaPath = normalizePath(cwd, pages[p].schemaPath)
        return {
          sitePath: p,
          schemaMarkdownPath: resolveSchemaMarkdownPath(pages[p].schemaMarkdown, abSchemaPath),
          schemaPath: abSchemaPath
        }
      })

      addSchemaListener(schemaPaths, async ret => {
        const targetConfog = pages[ret.sitePath]
        if (targetConfog) {
          const content = await transform({
            cwd,
            locale,
            write,
            ...targetConfog
          })
          await fs.writeFile(ret.filePath, content, 'utf-8')
        }
      })

      const ret = await batchTransform({
        cwd,
        locale,
        write,
        configs
      })

      return pagePaths.map((path, index) => {
        return {
          path,
          content: ret[index]
        }
      })
    }
  }
}
