import puppeteer from 'puppeteer';
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    await page.goto('https://app.solaroracle.cl/admin');
    await page.waitForSelector('#admin-pass');
    await page.type('#admin-pass', 'solar2026');
    await page.click('button.bg-emerald-500');
    await new Promise(r => setTimeout(r, 6000));
    await browser.close();
})();
