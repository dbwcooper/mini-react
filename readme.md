babel 配置文件的区别
使用自命名的文件作为项目级别的 默认babel 配置文件

"scripts": {
  "compile": "babel --config-file './babel.config1.js' src/index.js --out-dir lib "
},
babel.config.js
如果项目需要使用babel 打包 node_modules目录下的文件，可以使用此文件，并与webpack 的 alias 配合使用
或者 项目内使用了 git 子目录引入了一个新的包

babelrc 项目打包时，主项目内的需要打包的子依赖包 内的 babelrc 配置将不会被使用，babel 会直接使用root 目录下的 babel config 文件。