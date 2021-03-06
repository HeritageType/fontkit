import babel from 'rollup-plugin-babel';
import localResolve from 'rollup-plugin-local-resolve';
import json from 'rollup-plugin-json';
import brfs from 'brfs';
import { Readable } from 'stream';

function rollupBrfs(options = {}) {
  return {
    name: 'brfs',
    transform: function (code, id) {
      if (!id.match(/(ArabicShaper|IndicShaper|UniversalShaper)/)) {
        return null;
      }
      return new Promise(function (resolve, reject) {
        let output = '';
        const src = new Readable();
        src.push(code);
        src.push(null);
        const stream = src.pipe(brfs(id, options));
        stream.on('data', function (data) {
          output += data.toString();
        });
        stream.on('end', function () {
          resolve({
            code: output,
            map: { mappings: '' },
          });
        });
        stream.on('error', function (error) {
          reject(error);
        });
      });
    },
  };
}

function createConfig(filename, suffix = '') {
  const isBrowser = suffix === '.browser';
  return {
    input: `src/${filename}`,
    output: {
      file: `${filename}${suffix}.js`,
      format: isBrowser ? 'es' : 'cjs',
      sourcemap: true,
      interop: !!suffix,
    },
    external: [
      'restructure',
      'tiny-inflate',
      '@heritage-type/brotli/decompress',
      'unicode-properties',
      'clone',
      'deep-equal',
      'unicode-trie',
      'dfa',
      'restructure/src/utils',
      'fs'
    ],
    plugins: [
      localResolve(),
      json(),
      babel({
        presets: [
          [
            '@babel/preset-env',
            {
              // modules: false,
              targets: {
                browsers: "> 0.25%, last 2 versions",
              },
            },
          ],
        ],
      }),
      isBrowser
        ? rollupBrfs({ parserOpts: { sourceType: 'module' } })
        : undefined,

    ],
  };
}

export default [
  createConfig('base'),
  createConfig('index'),
  createConfig('index', '.browser'),
];
