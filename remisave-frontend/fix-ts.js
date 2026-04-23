const fs = require('fs');
const glob = require('glob');

function modifyFile(path, callback) {
  let content = fs.readFileSync(path, 'utf8');
  let newContent = callback(content);
  if (content !== newContent) {
    fs.writeFileSync(path, newContent);
    console.log(`Updated ${path}`);
  }
}

// 1. replace bigints
const files = [
  'app/api/faucet/route.ts',
  'app/components/user-position.tsx',
  'hooks/use-vault-operations.ts',
  'lib/utils.ts'
];
files.forEach(f => {
  modifyFile(f, c => {
    return c
      .replace(/1000000000n/g, 'BigInt(1000000000)')
      .replace(/10000000000n/g, 'BigInt(10000000000)')
      .replace(/=== 0n/g, '=== BigInt(0)')
      .replace(/\|\| 1n/g, '|| BigInt(1)')
      .replace(/\+ 1n/g, '+ BigInt(1)')
      .replace(/DECIMALS = 7n/g, 'DECIMALS = BigInt(7)')
      .replace(/10n \*\*/g, 'BigInt(10) **')
  });
});

// For BigInt exponentiation TS errors, add @ts-ignore
modifyFile('lib/utils.ts', c => {
  return c.replace(/const DECIMAL_MULTIPLIER = /g, '// @ts-ignore\nconst DECIMAL_MULTIPLIER = ')
          .replace(/const divisor = /g, '// @ts-ignore\n  const divisor = ')
          .replace(/return \(a \* b\) \/ /g, '// @ts-ignore\n  return (a * b) / ')
          .replace(/return \(a \* \(/g, '// @ts-ignore\n  return (a * (')
});

// 2. Faucet API
modifyFile('app/api/faucet/route.ts', c => {
  return c
    .replace('Networks.TESTNET_NETWORK_PASSPHRASE', 'Networks.TESTNET')
    .replace(/hostFunction: xdr\.HostFunction\.hostFunctionTypeInvokeContract\(\[\s*\/\/ Token contract address\s*new Address\(tokenContractId\)\.toScVal\(\),\s*nativeToScVal\('mint'\),\s*\/\/ Mint arguments: \[destination,\s*amount\]\s*new Address\(destination\)\.toScVal\(\),\s*nativeToScVal\(mintAmount\),\s*\]\),/g,
             `hostFunction: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: new Address(tokenContractId).toScAddress(),
            functionName: 'mint',
            args: [new Address(destination).toScVal(), nativeToScVal(mintAmount)]
          })
        ),`)
    .replace(/footprint: xdr\.SorobanTransactionData\.sorobanTransactionDataFromXDR\('', 'base64'\)\.ext\(\),/g, '');
});

// 3. hooks/use-vault-operations.ts
modifyFile('hooks/use-vault-operations.ts', c => {
  return c.replace("import { Server } from '@stellar/stellar-sdk'", "import { rpc } from '@stellar/stellar-sdk'");
});

// 4. lib/stellar-rpc.ts
modifyFile('lib/stellar-rpc.ts', c => {
  let nc = c.replace('Networks.TESTNET_NETWORK_PASSPHRASE', 'Networks.TESTNET');
  return nc;
});
