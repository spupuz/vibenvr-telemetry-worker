const { performance } = require('perf_hooks');

function getFlagEmojiOld(countryCode) {
    if (!countryCode || countryCode === 'Unknown' || countryCode.length !== 2) return '❓';
    try {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt());
        return String.fromCodePoint(...codePoints);
    } catch (e) {
        return '❓';
    }
}

function getFlagEmojiNew(countryCode) {
    if (!countryCode || countryCode === 'Unknown' || countryCode.length !== 2) return '❓';
    try {
        // Optimize: Avoid split() and map() arrays for just two characters
        const code1 = 127397 + countryCode.charCodeAt(0);
        // Note: countryCode might not be uppercase, we should uppercase it first or handle it
        return String.fromCodePoint(
            127397 + countryCode.toUpperCase().charCodeAt(0),
            127397 + countryCode.toUpperCase().charCodeAt(1)
        );
    } catch (e) {
        return '❓';
    }
}

let t0 = performance.now();
for(let i=0; i<100000; i++) {
    getFlagEmojiOld('US');
    getFlagEmojiOld('IT');
    getFlagEmojiOld('Unknown');
}
let t1 = performance.now();
console.log("old: ", t1 - t0);


t0 = performance.now();
for(let i=0; i<100000; i++) {
    getFlagEmojiNew('US');
    getFlagEmojiNew('IT');
    getFlagEmojiNew('Unknown');
}
t1 = performance.now();
console.log("new: ", t1 - t0);
