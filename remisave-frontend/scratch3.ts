import { Horizon } from '@stellar/stellar-sdk';
const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');
horizon.loadAccount('GA7Z4C2IDHZXDGWV52PQQHPH7HFODV3VNERO6OCRBMTP66L7YWFHROZC').then(acc => {
  console.log('Balances:', acc.balances);
}).catch(console.error);
