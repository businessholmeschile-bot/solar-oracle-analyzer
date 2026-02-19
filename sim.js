const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('admin.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: "dangerously" });
dom.window.fetch = async (url, opts) => {
    return {
        json: async () => ({ success: true, data: [{id: 1, detectado_en: '2026-02-19T00:00:00Z', tipo: 'LEAD', estado: 'Nuevo'}], count: 1 })
    };
};
dom.window._oracleLoaded = false;
dom.window.document.getElementById('admin-pass').value = 'solar2026';

dom.window.addEventListener('error', e => console.log('ERROR:', e.error));

try {
    dom.window.checkPass();
} catch(e) { console.error('checkpass error:', e); }

setTimeout(() => {
    console.log('done! HTML length:', dom.window.document.body.innerHTML.length);
}, 2000);
