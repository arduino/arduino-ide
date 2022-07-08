// Patch for the startup theme. Replaces the `ThemeService.get().loadUserTheme();` function at startup by directly setting the theme based on the OS theme.
// For all subsequent starts of the IDE the theme applied will be the last one set by the user.

// With the current version of Theia adopted (1.25) it is not possible to extend the `ThemeService`, it will be possible starting from Theia 1.27.
// Once the version of Theia is updated, this patch will be removed and this functionality will be implemented via dependency injection.

let arg = process.argv.splice(2)[0]
if (!arg) {
    console.error("The path to the index.js to patch is missing. Use 'node ./scripts/patch-frontend-index.js ./src-gen/frontend/index.js'")
    process.exit(1)
}
(async () => {
    const snippet = `
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      ThemeService.get().setCurrentTheme('arduino-theme-dark');
    } else {
      ThemeService.get().setCurrentTheme('arduino-theme');
    }`
    const { promises: fs } = require('fs')
    const path = require('path')
    const index = path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg)
    console.log(`>>> Patching 'ThemeService.get().loadUserTheme()' with the snippet to set the theme in ${index}.`)
    const content = await fs.readFile(index, { encoding: 'utf-8' })
    await fs.writeFile(index, content.replace('ThemeService.get().loadUserTheme();', snippet), { encoding: 'utf-8' })
    console.log(`<<< Successfully patched index.js.`)
})()
