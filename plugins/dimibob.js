const os = require('os')
const fs = require('mz/fs')
const path = require('path')
const axios = require('axios')
const moment = require('moment')

const defaultServer = 'http://dimigo.in/pages/dimibob_getdata.php'
const fields = ['breakfast', 'lunch', 'dinner', 'snack']
const mealTypes = Object.assign({}, ...fields.map(meal => ({ [meal]: meal })))

const getMeal = time =>
  time < 840 + 5 ? mealTypes.breakfast
  : time <= 1350 ? mealTypes.lunch
  : time <= 1950 ? mealTypes.dinner
  : time <= 2140 ? mealTypes.snack : null

module.exports = async argv => {
  const [now, flags] = [moment(), []]
  let meal = getMeal(now.hours() * 100 + now.minutes())

  if (meal) {
    if (argv.my.ignoreSnack && meal === mealTypes.snack) meal = null
    else flags.push(meal)
  }

  if (!meal) {
    if (argv.my.onlyToday) return {}

    now.add(1, 'day')
    flags.push(meal = mealTypes.breakfast, 'tomorrow')
  }

  const options = {
    method: 'get',
    timeout: argv.timeout || 0,
    url: argv.my.server || defaultServer,
    params: { d: now.format(argv.my.paramFormat || 'YYYYMMDD') }
  }

  const { data } = await axios(options)
  if (typeof data !== 'object' || !data[meal]) return {}

  const highlights = []
  const list = data[meal].split(/[ */]/).filter(x => x)

  if (argv.my.likes) {
    const file = path.resolve(argv.my.likes)
    const encoding = argv.encoding || 'utf-8'
    const list = (await fs.readFile(file, encoding)).split(os.EOL)
    highlights.push(...list.map(item => item.trim()).filter(x => x))
  }

  const table = [
    list,
    Math.ceil(list.length / 2),
    { list: highlights, color: argv.my.likesColor }
  ]

  const command = {
    input: argv.my.cmd || 'dimibob',
    output: { table },
    flags: flags.filter(x => x),
    params: [
      argv.my.cmdFormat
      ? now.format(argv.my.cmdFormat)
      : options.params.d
    ]
  }

  return { command }
}

module.exports.pluginName = 'dimibob'
