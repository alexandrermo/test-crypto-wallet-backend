const express = require("express");
const bip39 = require("bip39");
const bitcoin = require("bitcoinjs-lib");
const { ethers, JsonRpcProvider } = require("ethers");
const ecc = require("tiny-secp256k1");
const bip32 = require("bip32").BIP32Factory(ecc);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const etherumProvider = "https://rpc.ankr.com/eth_goerli";

const generateEthereumWallet = (mnemonic) => {
  const provider = new JsonRpcProvider(etherumProvider);
  const wallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider);

  return {
    name: "Ethereum",
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
};

const generateBitcoinWallet = (mnemonic) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed, bitcoin.networks.testnet);
  const keyPair = root.derivePath("m/44'/0'/0'/0/0");
  const { address } = bitcoin.payments.p2pkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network: bitcoin.networks.testnet,
  });
  return {
    name: "Bitcoin",
    address,
    privateKey: keyPair.toWIF(),
  };
};

const generateLitecoinWallet = (mnemonic) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed, bitcoin.networks.testnet);
  const keyPair = root.derivePath("m/44'/2'/0'/0/0");
  const { address } = bitcoin.payments.p2pkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network: bitcoin.networks.testnet,
  });
  return {
    name: "Litecoin",
    address,
    privateKey: keyPair.toWIF(),
  };
};

const generateBitcoinCashWallet = (mnemonic) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  const bitcoinCashNetwork = {
    messagePrefix: "\x18Bitcoin Cash Signed Message:\n",
    bip32: { public: 0x043587cf, private: 0x04358394 },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
  };

  const root = bip32.fromSeed(seed, bitcoinCashNetwork);
  const keyPair = root.derivePath("m/44'/145'/0'/0/0");
  const { address } = bitcoin.payments.p2pkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network: bitcoinCashNetwork,
  });
  return {
    name: "Bitcoin Cash",
    address,
    privateKey: keyPair.toWIF(),
  };
};

const generateDogecoinWallet = (mnemonic) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed, bitcoin.networks.testnet);
  const keyPair = root.derivePath("m/44'/3'/0'/0/0");
  const { address } = bitcoin.payments.p2pkh({
    pubkey: Buffer.from(keyPair.publicKey),
    network: bitcoin.networks.testnet,
  });
  return {
    name: "Dogecoin",
    address,
    privateKey: keyPair.toWIF(),
  };
};

const generateWallets = (mnemonic) => {
  const walletsGenerated = {
    etherum: generateEthereumWallet(mnemonic),
    bitcoin: generateBitcoinWallet(mnemonic),
    litecoin: generateLitecoinWallet(mnemonic),
    bitcoinCash: generateBitcoinCashWallet(mnemonic),
    dogecoin: generateDogecoinWallet(mnemonic),
  };

  return walletsGenerated;
};

// Rota para criar carteira a partir de uma frase-semente
app.get("/create-wallet", async (req, res) => {
  try {
    const generateMnemonic = () => {
      return bip39.generateMnemonic();
    };

    const mnemonic = generateMnemonic();

    const wallets = generateWallets(mnemonic);

    res.json({
      mnemonic,
      wallets,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: `${error}` });
  }
});

app.post("/open-wallet", async (req, res) => {
  try {
    const wallets = generateWallets(req.body.mnemonic);

    res.json({
      mnemonic: req.body.mnemonic,
      wallets,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: `${error}` });
  }
});

app.get("/total-supply-token", async (req, res) => {
  try {
    const provider = new JsonRpcProvider(etherumProvider);

    const tokenChainlinkAddress = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";

    const erc20Abi = [
      "function totalSupply() view returns (uint256)",
      "function decimals() view returns (uint8)",
    ];

    async function getTotalSupply() {
      const contract = new ethers.Contract(
        tokenChainlinkAddress,
        erc20Abi,
        provider
      );
      const totalSupply = await contract.totalSupply();
      const decimals = await contract.decimals();
      const totalSupplyFormatted = ethers.utils.formatUnits(
        totalSupply,
        decimals
      );

      return totalSupplyFormatted;
    }

    res.json({
      totalSupply: getTotalSupply(),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: `${error}` });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
