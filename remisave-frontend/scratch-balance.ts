import { Account, Address, BASE_FEE, Networks, Operation, rpc, TransactionBuilder, xdr, scValToNative } from '@stellar/stellar-sdk';
async function checkBalance() {
  const rpcServer = new rpc.Server('https://soroban-testnet.stellar.org', { allowHttp: true });
  const userAddr = new Address('GA7Z4C2IDHZXDGWV52PQQHPH7HFODV3VNERO6OCRBMTP66L7YWFHROZC');
  const contractId = 'CAOJETDKV6B2CK7LF7P2ZGGAM323BMDE4XAQZK6HDKFQUVOJDSGAI77Y';
  const sourceAccount = new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');
  
  const txBuilder = new TransactionBuilder(sourceAccount, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET });
  txBuilder.addOperation(
    Operation.invokeHostFunction({
      func: xdr.HostFunction.hostFunctionTypeInvokeContract(
        new xdr.InvokeContractArgs({
          contractAddress: new Address(contractId).toScAddress(),
          functionName: 'balance',
          args: [userAddr.toScVal()]
        })
      ), auth: []
    })
  );
  
  const tx = txBuilder.setTimeout(30).build();
  const response = await rpcServer.simulateTransaction(tx);
  // @ts-ignore
  console.log('Balance:', scValToNative(response.result.retval).toString());
}
checkBalance().catch(console.error);
