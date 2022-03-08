// Patch the Theia spinner: https://github.com/eclipse-theia/theia/pull/10761#issuecomment-1131476318
// Replaces the `theia-preload` selector with `old-theia-preload` in the generated `index.html`.
let arg = process.argv.splice(2)[0]
if (!arg) {
    console.error("The path to the index.html to patch is missing. Use 'node patch-theia-preload.js ./path/to/index.html'")
    process.exit(1)
}
(async () => {
    const { promises: fs } = require('fs')
    const path = require('path')
    const index = path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg)
    console.log(`>>> Patching 'theia-preload' with 'old-theia-preload' in ${index}.`)
    const content = await fs.readFile(index, { encoding: 'utf-8' })
    await fs.writeFile(index, content.replace(/theia-preload/g, 'old-theia-preload'), { encoding: 'utf-8' })
    console.log(`<<< Successfully patched index.html.`)
})()