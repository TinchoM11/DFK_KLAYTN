import { BigNumber, ethers } from "ethers";
import dotenv from "dotenv";
import { SynapseSDK } from "@synapsecns/sdk-router";
import { checkAndSetAllowance } from "./approveTxDFK";
import axios from "axios";
dotenv.config();

const ERC20_ABI = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

const KlaytnProvider = new ethers.providers.JsonRpcProvider(
  process.env.KLAYTON_RPC_MAINNET as string
);

const DFKProvider = new ethers.providers.JsonRpcProvider(
  process.env.DFK_RPC_MAINNET as string
);

const main = async () => {
  const chainIds = [8217, 53935];
  const providers = [KlaytnProvider, DFKProvider];
  const Synapse = new SynapseSDK(chainIds, providers);

  const deadline = BigNumber.from(Math.floor(Date.now() / 1000) + 60 * 20);

  const fromTokenContract = new ethers.Contract(
    "0x30C103f8f5A3A732DFe2dCE1Cc9446f545527b43", // wJEWEL on DFK, just to know decimals of native also
    ERC20_ABI,
    KlaytnProvider
  );

  const fromTokenDecimals = await fromTokenContract.decimals();

  const KLAY_TOKEN_DFK = "0x97855Ba65aa7ed2F65Ed832a776537268158B78a";

  const amountToBridge = ethers.utils.parseUnits("2", fromTokenDecimals); // Change decimals to "fromTokenDecimals" if it's an ERC20
  const quote = await Synapse.bridgeQuote(
    8217, // From Chain
    53935, // To Chain
    "0x30C103f8f5A3A732DFe2dCE1Cc9446f545527b43", // From token
    "0x0000000000000000000000000000000000000000", // To token
    amountToBridge,
    deadline,
    true
  );

  /// This returns the complete Quote object
  console.log(quote);

  // *** IMPORTANT IN ORDER TO BRIDGE ERC20 TOKENS ***
  // *** IF WE BRIDGE AN ERC20 WE NEED TO APPROVE THE TOKEN FIRST ***
  // *** UNCOMMENT THIS IF YOU ARE BRIDGING AN ERC20 ***

  await checkAndSetAllowance(
    "0x30C103f8f5A3A732DFe2dCE1Cc9446f545527b43",
    quote.routerAddress,
    amountToBridge
  );

  // The Following SDK Function returns the transaction data to be sent to the bridge
  // It takes as param the quote object returned from bridgeQuote()
  const BridgeTx = await Synapse.bridge(
    "0x23eD50dB3e7469695DD30FFD22a7B42716A338FC", // To Address (Wallet Address)
    quote.routerAddress, // Router Address
    8217, // From Chain
    53935, // To Chain
    "0x30C103f8f5A3A732DFe2dCE1Cc9446f545527b43", // From Token Address
    amountToBridge, // Amount
    quote.originQuery, // Origin query from bridgeQuote()
    quote.destQuery // Origin query from bridgeQuote()
  );

  console.log("BridgeTx:", BridgeTx);

  const senderWallet = new ethers.Wallet(
    process.env.DFK_PK as string,
    KlaytnProvider
  );

  const nonce = await KlaytnProvider.getTransactionCount(
    senderWallet.address,
    "latest"
  );

  const gasPrice = await KlaytnProvider.getGasPrice();
  const txRequest = {
    to: BridgeTx.to,
    value: 0, // If it's an ERC20 token, set this to 0
    data: BridgeTx.data,
    gasLimit: 600000,
    gasPrice: gasPrice.mul(110).div(100),
    nonce: nonce,
    chainId: 8217,
  };

  const signedTx = await senderWallet.signTransaction(txRequest);
  const txResponse = await KlaytnProvider.sendTransaction(signedTx);
  console.log("Transaction Response:", txResponse);

  txResponse.wait();
};

main();

const synapseGetBridgeStatus = async (txHash: string) => {
  const query = `
{
  bridgeTransactions(
    txnHash: "${txHash}"
    useMv: true
  ) {
    fromInfo {
      chainID
      destinationChainID
      address
      txnHash
      USDValue
      tokenSymbol
      blockNumber
      formattedTime
    }
    kappa
    swapSuccess
    toInfo {
      chainID
      destinationChainID
      address
      txnHash
      value
      formattedValue
      USDValue
      tokenAddress
      tokenSymbol
      blockNumber
      time
      formattedTime
      formattedEventType
      eventType
    }
  }
}
`;

  const res = await axios.post("https://explorer.omnirpc.io/graphql", {
    query,
  });
  console.log(JSON.stringify(res.data, null, 2));
};

// synapseGetBridgeStatus(
//   "0xcbfb18e58c23a2a0ced07f97b83c1179feceb29acf769d2092a59f229a899d13"
//   //"0xe3b30b60ec880a9576dbf43efee9a64a40c814e947401e22681baba9a3800e35"
// );
