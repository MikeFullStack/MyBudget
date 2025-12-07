const firebaseAi = require('firebase/ai');
console.log('firebase/ai exports:', Object.keys(firebaseAi));

try {
    const firebase = require('firebase/app');
    console.log('firebase/app exports:', Object.keys(firebase));
} catch (e) { }
