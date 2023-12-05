import nyxb from '@nyxb/eslint-config'

export default nyxb({
   typescript: true,
   rules: {
      'ts/no-use-before-define': 0,
      'ts/no-unused-vars': 0,
      'ts/restrict-plus-operands': 0,
      'unused-imports/no-unused-vars': 0,
      'no-cond-assign': 0,
      'unicorn/prefer-number-properties': 0,
      'node/prefer-global/buffer': 0,
   },
})
