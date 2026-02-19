const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
        await page.goto('file://' + __dirname + '/admin.html');
        await page.waitForSelector('#admin-pass');
        await page.evaluate(() => {
            document.getElementById('admin-pass').value = 'solar2026';
            checkPass();
        });
        await new Promise(r => setTimeout(r, 4000));
        await browser.close();
    } catch (e) { console.error(e); }
})();
