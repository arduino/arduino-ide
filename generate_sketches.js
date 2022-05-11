const fs = require('fs').promises;
const path = require('path');

(async () => {
  const sketchbookPath = '/Users/a.kitta/Documents/Arduino';
  for (let i = 0; i < 1000; i++) {
    const sketchName = `my_sketch_${i}`;
    await fs.mkdir(path.join(sketchbookPath, sketchName), { recursive: true });
    await fs.writeFile(
      path.join(sketchbookPath, sketchName, `${sketchName}.ino`),
      `
void setup() {}
void loop() {}
`
    );
  }
})();
