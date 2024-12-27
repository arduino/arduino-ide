const XMLHttpRequest = require('xhr2');
const fs = require('fs');

const JSONBIN_MASTER_KEY = process.env.JSONBIN_MASTER_KEY;
const JSONBIN_ID = process.env.JSONBIN_ID;

const destFolder = './scripts/themes/tokens';

if (!fs.existsSync(destFolder)) {
  fs.mkdirSync(destFolder);
}

let req = new XMLHttpRequest();

req.open('GET', 'https://api.jsonbin.io/v3/b/' + JSONBIN_ID + '/latest', true);
req.setRequestHeader('X-Master-Key', JSONBIN_MASTER_KEY);
req.send();

req.onreadystatechange = () => {
  if (req.readyState == XMLHttpRequest.DONE) {
    const tokens = JSON.parse(req.responseText).record.values;
    fs.writeFile(
      destFolder + '/arduino-tokens.json',
      JSON.stringify(tokens),
      (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log('Arduino tokens file saved!');
      }
    );
  }
};
