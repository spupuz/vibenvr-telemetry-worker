const { performance } = require('perf_hooks');
const data = {
    countries: Array.from({length: 200}, (_, i) => ({ name: 'Country' + i, count: Math.random() * 100 })),
    site_countries: Array.from({length: 200}, (_, i) => ({ name: 'Country' + i, count: Math.random() * 100 }))
};

function prepDataOld(list, lk='name', vk='count', limit=8, showFlags=false) {
    list = [...(list||[])].sort((a,b) => b[vk]-a[vk]);
    const top = list.slice(0, limit);
    const rest = list.slice(limit).reduce((s,r)=>s+r[vk], 0);
    if (rest > 0) top.push({[lk]:'Other',[vk]:rest});

    const labels = top.map(i => {
        let name = i[lk];
        if (typeof name === 'string') {
            name = name.replace(/\(R\)|\(TM\)/g, '').replace(/ Processor/gi, '').replace(/ CPU/gi, '').replace(/ @ \d+\.\d+GHz/gi, '').trim();
            if (name.length > 28) name = name.substring(0, 26) + '...';
        }
        if (showFlags && name !== 'Other' && name !== 'Unknown') {
            return 'FLAG ' + name;
        }
        return name;
    });

    return { labels, data: top.map(i=>i[vk]) };
}

const CLEAN_RE = /\(R\)|\(TM\)| Processor| CPU| @ \d+\.\d+GHz/gi;

function prepDataNew(list, lk='name', vk='count', limit=8, showFlags=false) {
    list = [...(list||[])].sort((a,b) => b[vk]-a[vk]);
    const top = list.slice(0, limit);
    const rest = list.slice(limit).reduce((s,r)=>s+r[vk], 0);
    if (rest > 0) top.push({[lk]:'Other',[vk]:rest});

    const labels = top.map(i => {
        let name = i[lk];
        if (typeof name === 'string') {
            name = name.replace(CLEAN_RE, '').trim();
            if (name.length > 28) name = name.substring(0, 26) + '...';
        }
        if (showFlags && name !== 'Other' && name !== 'Unknown') {
            return 'FLAG ' + name;
        }
        return name;
    });

    return { labels, data: top.map(i=>i[vk]) };
}

let t0 = performance.now();
for (let i = 0; i < 10000; i++) {
    prepDataOld(data.countries, 'name', 'count', 15, true);
}
let t1 = performance.now();
console.log("prepDataOld took " + (t1 - t0) + " milliseconds.");

t0 = performance.now();
for (let i = 0; i < 10000; i++) {
    prepDataNew(data.countries, 'name', 'count', 15, true);
}
t1 = performance.now();
console.log("prepDataNew took " + (t1 - t0) + " milliseconds.");
