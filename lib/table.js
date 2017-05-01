const chalk = require('chalk')
const { max, ceil, floor } = Math
const multibytes = /[가-힣ㄱ-ㅎㅏ-ㅣ]/g
const maxLength = process.stdout.columns

const space = n => ' '.repeat(n)
const sum = arr => arr.reduce((a, b) => a + b, 0)
const len = str => str ? str.replace(multibytes, '콩콩').length : 0
const pad = (str, n) => space(ceil(n / 2)) + str + space(floor(n / 2))

const table = (arr, size, options) => {
  const chunks = [...Array(ceil(arr.length / size))]
    .map((_, i) => arr.slice(i * size, ++i * size))
    .map(c => [...c, ...space(size)].slice(0, size))

  const lengths = [...Array(size)]
    .map((_, i) => 2 + max(...chunks.map(c => len(c[i]))))

  const exceeds = size + sum(lengths) >= maxLength
  if (exceeds && size > 1) return table(arr, size - 1, options)

  const highlight = str =>
    options.highlight.some(h => str.includes(h)) && chalk.bold.blue(str)

  let padded = chunks
    .map(c => c.map((str, i) => pad(str, lengths[i] - len(str))))
    .map(c => c.map(str => (options.highlight && highlight(str)) || str))

  const border = ([left, filler, centre, right]) =>
    [left, lengths.map(n => filler.repeat(n)).join(centre), right].join('')

  const lines = padded
    .map(c => [null, ...c, null].join('│'))
    .reduce((res, c, i) => [...res, border(i ? '├─┼┤' : '┌─┬┐'), c], [])

  return [...lines, border('└─┴┘')]
}

module.exports = table