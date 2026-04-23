import { nativeToScVal } from '@stellar/stellar-sdk';
console.log(nativeToScVal(1000n).switch().name);
