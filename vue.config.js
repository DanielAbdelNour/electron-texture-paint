module.exports = {
    chainWebpack: config => {
      config.module
        .rule('fbx')
        .test(/\.fbx$/)
        .use('file-loader')
          .loader('file-loader')
          .end()
    }
  }