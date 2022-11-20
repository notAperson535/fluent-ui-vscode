const fs = require("fs")
const wallpaper = require("wallpaper")

let img = ''

async function go() {
    const wallPath = await wallpaper.get();

    // const img = await sharp(wallPath).toBuffer()

    // console.log(img);

    // return "data:image/png;base64," + img.toString('base64');

    //var base64str = fs.readFileSync("C:/Windows/Web/Wallpaper/Spotlight/img14.jpg", 'base64');
    var base64str = fs.readFileSync(wallPath, 'base64');

    return "data:image/png;base64," + base64str;
}

async function thing() {

    img = await go()

}

thing();

console.log(img)


fs.writeFile('helloworld.txt', img, function (err) {
    if (err) return;
    console.log('Hello World > helloworld.txt');
});
