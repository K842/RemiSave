import { Contract, rpc, Networks } from '@stellar/stellar-sdk';
const SERVER = new rpc.Server('https://soroban-testnet.stellar.org');
SERVER.getContractSpec('CAOJETDKV6B2CK7LF7P2ZGGAM323BMDE4XAQZK6HDKFQUVOJDSGAI77Y').then(spec => {
  const approve = spec.entries.find(e => e.name() === 'approve');
  console.log('Approve args:', approve.value().inputs().map(i => i.name().toString() + ':' + i.type().switch().name));
  const transfer = spec.entries.find(e => e.name() === 'transfer');
  console.log('Transfer args:', transfer.value().inputs().map(i => i.name().toString() + ':' + i.type().switch().name));
}).catch(console.error);
