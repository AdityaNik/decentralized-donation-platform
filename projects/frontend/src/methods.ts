import * as algokit from '@algorandfoundation/algokit-utils';
import { CrazyContractClient, CrazyContractFactory } from './contracts/CrazyContract';
import { signTransaction, TransactionSigner } from 'algosdk';
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount';

// **Create the CrazyContract application**
export function create(
  algorand: algokit.AlgorandClient,
  contractFactory: CrazyContractFactory,
  signer: TransactionSigner,
  sender: string,
  setAppId: (id: bigint) => void
) {
  return async () => {
    const result = await contractFactory.send.create.createApplication({
      args: [],
      sender
    });

    const contractClient = new CrazyContractClient({
      appId: result.appClient.appId,
      algorand,
      defaultSigner: signer,
      appName: 'CrazyContract',
    });


    console.log('CrazyContract deployed with App ID:', result.appClient.appId);
    setAppId(BigInt(result.appClient.appId));
  };
}

// **Donate to the contract**
export function donate(
  algorand: algokit.AlgorandClient,
  contractClient: CrazyContractClient,
  sender: string,
  amount: bigint
) {
  return async () => {
    console.log(`Donating: ${amount} µAlgos`);
    console.log(algorand)
    console.log(contractClient)
    console.log(sender)

    console.log("CrazyContract App ID:", contractClient.appClient.appId);

    const donationTxn = await algorand.createTransaction.payment({
      sender,
      receiver: contractClient.appClient.appAddress,
      amount: new AlgoAmount({ microAlgos: amount }),
      extraFee: algokit.algo(0.001),
    });

    await contractClient.send.donate({
      sender: sender,
      args: [amount, donationTxn],

    });

    console.log('Donation successful!');
  };
}

// **Withdraw funds (Only Owner)**
export function withdraw(
  contractClient: CrazyContractClient,
  sender: string,
  amount: bigint,
  receiver: string
) {
  return async () => {
    console.log(`Withdrawing ${amount} µAlgos to ${receiver}`);

    await contractClient.send.withdraw({
      args: [amount, receiver],
      sender,
    });

    console.log('Withdrawal successful!');
  };
}

// **Get total donations**
export function getTotalDonations(contractClient: CrazyContractClient, sender: string) {
  return async () => {
    const totalDonations = await contractClient.send.getTotalDonations({
      sender,
      args: []
    });
    console.log('Total Donations:', totalDonations.return);
    return totalDonations.return;
  };
}

// **Get donation amount of a specific donor**
export function getDonations(
  contractClient: CrazyContractClient,
  donor: string
) {
  return async () => {
    const donations = await contractClient.send.getDonations({ args: [donor] });
    console.log(`Donations by ${donor}:`, donations.return);
    return donations.return;
  };
}

// **Delete the contract and withdraw remaining funds**
export function deleteApp(
  contractClient: CrazyContractClient,
  sender: string,
  setAppId: (id: bigint) => void
) {
  return async () => {
    console.log('Deleting contract...');

    await contractClient.send.delete({
      sender,
      args: []
    })

    setAppId(BigInt(0));
    console.log('Contract deleted.');
  };
}
