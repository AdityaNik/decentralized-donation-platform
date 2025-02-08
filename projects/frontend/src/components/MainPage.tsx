import React, { useState, useEffect } from 'react';
import ConnectWallet from './ConnectWallet';
import { useWallet } from '@txnlab/use-wallet';
import MethodCall from './MethodCall';
import * as methods from '../methods';
import * as algokit from '@algorandfoundation/algokit-utils';
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs';
import { CrazyContractClient, CrazyContractFactory } from '../contracts/CrazyContract';

const MainPage: React.FC = () => {
  // Configure Algokit
  algokit.Config.configure({ populateAppCallResources: true });

  // Wallet & State Management
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false);
  const [donationAmount, setDonationAmount] = useState<{ [key: number]: string }>({});
  const [showInput, setShowInput] = useState<{ [key: number]: boolean }>({});
  const [appId, setAppId] = useState<bigint>(BigInt(0));
  const [totalDonations, setTotalDonations] = useState<String>('');

  const { activeAccount, activeAddress, signer: transactionSigner } = useWallet();

  // Algorand Client Setup
  const algodConfig = getAlgodConfigFromViteEnvironment();
  const algorand = algokit.AlgorandClient.fromConfig({ algodConfig });
  algorand.setDefaultSigner(transactionSigner);

  // Factory for deploying contracts
  const contractFactory = new CrazyContractFactory({
    algorand,
    defaultSigner: transactionSigner,
    defaultSender: activeAddress!,
  });

  // Contract Client (Recreated when App ID changes)
  const contractClient = new CrazyContractClient({
    appId: appId, // Ensure appId is updated correctly
    algorand,
    defaultSigner: transactionSigner,
  });

  // Demo Campaigns
  const demoCampaigns = [
    { id: 1, title: 'Campaign 1', description: 'This is a demo campaign' },
    { id: 2, title: 'Campaign 2', description: 'This is another demo campaign' },
  ];

  // **Create Contract**
  const handleCreateContract = async () => {
    try {
      const createContract = methods.create(algorand, contractFactory, transactionSigner, activeAddress!, setAppId);
      await createContract(); // Execute contract creation
      fetchTotalDonations(); // Fetch total donations after deployment
    } catch (error) {
      console.error("Failed to deploy contract:", error);
    }
  };

  // **Fetch Total Donations**
  const fetchTotalDonations = async () => {
    if (!appId || appId === BigInt(0)) return;
    try {
      const total = await methods.getTotalDonations(contractClient, activeAddress!)();
      setTotalDonations(total + '');
    } catch (error) {
      console.error("Failed to fetch total donations:", error);
    }
  };

  // **Donate**
  const handleDonate = (campaignId: number) => {
    setShowInput(prevState => ({ ...prevState, [campaignId]: true }));
  };

  const handleAmountChange = (campaignId: number, amount: string) => {
    setDonationAmount(prevState => ({ ...prevState, [campaignId]: amount }));
  };

  // **Ensure the contract is deployed before donating**
  const handleDonationClick = async (campaignId: number) => {
    if (!appId || appId === BigInt(0)) {
      console.error("Error: Contract not deployed or appId is invalid!");
      return;
    }

    const amount = BigInt(donationAmount[campaignId] || '0') * BigInt(10e5); // Convert ALGO to microAlgos
    try {
      await methods.donate(algorand, contractClient, activeAddress!, amount)();
      fetchTotalDonations(); // Refresh total donations after donation
    } catch (error) {
      console.error("Donation failed:", error);
    }
  };

  // **Fetch total donations on load & when `appId` changes**
  useEffect(() => {
    if (appId && appId !== BigInt(0)) {
      fetchTotalDonations();
    }
  }, [appId]);

  // **Toggle Wallet Modal**
  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal);
  };

  return (
    <div>
      <nav>
        {!activeAccount ? (
          <button onClick={toggleWalletModal}>Connect Wallet</button>
        ) : (
          <>
            <button>Disconnect Wallet {activeAddress}</button>
            <span>{activeAccount?.name}</span>
          </>
        )}
      </nav>

      <main>
        <h1>Demo Campaigns</h1>
        <button onClick={handleCreateContract}>Deploy Smart Contract</button>
        <p>App ID: {appId.toString()}</p>
        <h3>Total Donations: {Number(totalDonations) / 10e5} ALGO</h3>

        <div>
          {demoCampaigns.map(campaign => (
            <div key={campaign.id}>
              <h2>{campaign.title}</h2>
              <p>{campaign.description}</p>
              <button onClick={() => handleDonate(campaign.id)}>Donate</button>

              {showInput[campaign.id] && (
                <div>
                  <input
                    type="text"
                    value={donationAmount[campaign.id] || ''}
                    onChange={(e) => handleAmountChange(campaign.id, e.target.value)}
                    placeholder="Enter amount"
                  />
                  <button onClick={() => handleDonationClick(campaign.id)}>
                    Donate {donationAmount[campaign.id]} ALGO
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
    </div>
  );
};

export default MainPage;
