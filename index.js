const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const readline = require('readline');
const cp = require('child_process');

let config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")).toString());

console.log("Downloading latest RPZ from oisd");

fetch(config.dl_url).then(e => e.arrayBuffer()).then(e => {
    let ws = fs.createWriteStream("rpz.tmp");
    ws.write(Buffer.from(e));
    ws.close();
    processRPZ();
}).catch(e => console.error(e));

async function processRPZ() {
    const rl = readline.createInterface({
        input: fs.createReadStream("rpz.tmp"),
        output: process.stdout,
        terminal: false
    });
    let fsbuff = fs.createWriteStream(config.filename);
    console.log("Processing RPZ");
    for await (let line of rl) {
        let nline = line.replace("CNAME .", "A " + config.target);
        fsbuff.write(new Buffer.from(nline + "\n"));
    }
    console.log("Cleaning Up");
    fsbuff.close();
    fs.rmSync("rpz.tmp");

    console.log("Running reconfigure command");
    process.stdout.write(cp.execSync(config.reconfigure_command));
}