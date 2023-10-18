import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import { covalentGetERC20Balances, covalentGetNFTBalances } from "./covalentHq";
import { getTokenPriceWithDexscreener } from "./dexScreener";
dotenv.config();

/// ************************************************* ///
/// ************************************************* ///
/// **** AT THE BOTTOM OF THE FILE YOU WILL FIND **** ///
/// ***** THE FUNCTIONS YOU CAN RUN TO TEST DFK ***** ///
/// **** JUST COMMENT/UNCOMMENT THE ONE YOU WANT **** ///
/// ************************************************* ///

const DFK_PK = process.env.DFK_PK as string;
const DFK_RPC = process.env.DFK_RPC_MAINNET as string;
const provider = new ethers.providers.JsonRpcProvider(DFK_RPC);

const getBalance = async () => {
  const balance = await provider.getBalance(
    "0x8f444b150741d06d56931e4db73b0c9afa062ca3",
    "latest"
  );

  // Balance of Specific Address:
  console.log("Balance of Specific Address on DFK:");
  console.log(balance.toString());
};

const sendNativeToken = async () => {
  console.log("---------- Sending a Transaction of Native Token ----------");
  const walletWithBalance = new ethers.Wallet(DFK_PK, provider);
  console.log(
    "Balance Before Transfer:" +
      (await walletWithBalance.getBalance()).toString()
  );
  const amount = ethers.BigNumber.from("1000000000000000000"); // 1 JEWEL
  const transaction = {
    to: "0xc68f118ba14aff63B66d0f7D84c5c9861F5FB862",
    value: amount,
  };

  try {
    const txResponse = await walletWithBalance.sendTransaction(transaction);
    console.log("Transaction Hash", txResponse.hash);
  } catch (error) {
    console.error("Error sending the transaction", error);
  }
};

const sendERC20Token = async () => {
  console.log("---------- Sending a Transaction of ERC20 Token ----------");
  const walletWithBalance = new ethers.Wallet(DFK_PK, provider);
  const erc20TokenContractAddress =
    "0x3AD9DFE640E1A9Cc1D9B0948620820D975c3803a";
  const erc20TokenContract = new ethers.Contract(
    erc20TokenContractAddress,
    ERC20_ABI,
    walletWithBalance
  );

  // Dirección del destinatario de la transferencia
  const toAddress = "0xc68f118ba14aff63B66d0f7D84c5c9861F5FB862";
  const tokenDecimals = await erc20TokenContract.decimals();

  const actualBalance = await erc20TokenContract.balanceOf(
    walletWithBalance.address
  );
  console.log(
    "Actual Balance of Token:",
    ethers.utils.formatUnits(actualBalance, tokenDecimals)
  );

  const amountToTransfer = actualBalance.div(2);
  const txResponse = await erc20TokenContract.transfer(
    toAddress,
    amountToTransfer
  );

  console.log("Transaction Hash Transfering ERC20 Token", txResponse.hash);
};

const getTxReceipt = async () => {
  // Get Transaction Receipt:
  const txReceipt = await provider.waitForTransaction(
    "0xae98e8609bc247841f7be04db0f5deca20d257cc0b5ca5c2789ad098617aee6d"
  );
  console.log("--------------------");
  console.log("Get  Transaction Receipt:");
  console.log(txReceipt);
};

// FUNCTION TO GET SUPPORTED TOKENS IN DFK FROM AVASCAN, NOT WORKING VERY WELL
// THE METHOD BELOW THIS ONE IS THE ONE WE SHOULD USE
export async function getDFKTokens() {
  const url =
    "https://avascan.info/api/list-erc20?query=&chainId=53935&ecosystem=avalanche";

  const headers = {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9,es-ES;q=0.8,es;q=0.7",
    "cache-control": "max-age=0",
    "content-type": "application/json",
    "if-none-match": '"wl1psxbodb8dr"',
    "sec-ch-ua":
      '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    Referer: "https://avascan.info/blockchain/dfk/tokens/erc20",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };

  let tokens: any[] = [];
  try {
    console.log("Getting DFK Tokens...");
    const response = await axios.get(url, { headers });
    //console.log("DFK Tokens:", JSON.stringify(response.data, null, 2));
    response.data.items.map((token: any) => {
      if (token.name !== "")
        tokens.push({
          name: token.name,
          symbol: token.symbol,
          contractAddress: token.address,
          decimals: token.decimals,
        });
    });

    console.log("DFK Tokens:", JSON.stringify(tokens, null, 2));
    console.log("DFK Tokens Length:", tokens.length);
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// FUNCTIONS TO GET THE METADATA OF THE MOST IMPORTANT TOKENS IN DFK
// INVENTORY, GOLD CROPS, RAFFLE, COLLECTIBLES, GOVERNANCE, POWER TOKENS, ECOSYSTEM
export const ERC20_ABI = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

const ERC20TokensDFK = [
  // Inventory
  "0xB78d5580d6D897DE60E1A942A5C1dc07Bc716943",
  "0x0776b936344DE7bd58A4738306a6c76835ce5D3F",
  "0x848Ac8ddC199221Be3dD4e4124c462B806B6C4Fd",
  "0x04B43D632F34ba4D4D72B0Dc2DC4B30402e5Cf88",
  "0xc2Ff93228441Ff4DD904c60Ecbc1CfA2886C76eB",
  "0xA2cef1763e59198025259d76Ce8F9E60d27B17B5",
  "0x60170664b52c035Fcb32CF5c9694b22b47882e5F",
  "0x7f46E45f6e0361e7B9304f338404DA85CB94E33D",
  "0xd44ee492889C078934662cfeEc790883DCe245f3",
  "0xc6030Afa09EDec1fd8e63a1dE10fC00E0146DaF3",
  "0x3E022D84D397F18743a90155934aBAC421D5FA4C",
  "0x97b25DE9F61BBBA2aD51F1b706D4D7C04257f33A",
  "0x6513757978E89e822772c16B60AE033781A29A4F",
  "0x576C260513204392F0eC0bc865450872025CB1cA", // DFK Gold
  "0x79fE1fCF16Cc0F7E28b4d7B97387452E3084b6dA", // DFK Gaia V2
  // Gold Crops
  "0x268CC8248FFB72Cd5F3e73A9a20Fa2FF40EfbA61",
  "0x3bcb9A3DaB194C6D8D44B424AF383E7Db51C82BD",
  "0xe7a1B580942148451E47b92e95aEB8d31B0acA37",
  "0x0096ffda7A8f8E00e9F8Bbd1cF082c14FA9d642e",
  "0x60A3810a3963f23Fa70591435bbe93BF8786E202",
  "0xBcdD90034eB73e7Aec2598ea9082d381a285f63b",
  "0x137995beEEec688296B0118131C1052546475fF3",
  "0x68eE50dD7F1573423EE0Ed9c66Fc1A696f937e81",
  "0x473A41e71618dD0709Ba56518256793371427d79",
  "0x80A42Dc2909C0873294c5E359e8DF49cf21c74E4",
  "0xA7CFd21223151700FB82684Cd9c693596267375D",
  "0xE7CB27ad646C49dC1671Cb9207176D864922C431",
  // Raffle - Raffle Tickets are non-transferrable;
  // So they don't have a price
  "0xBbd7c4Be2e54fF5e013471162e1ABAD7AB74c3C3", // null price
  //Collectibles -- Collectible Items are non-transferrable
  // So they don't have a price
  "0x184223A0921B58F5a0ddFD6448d8b2715EcC87a7", // null price
  "0x69B4B9F339F9da27f28f610A395f2dE1F1A24141", // null price
  "0x4Aa517d7DAadD2e22d2b6d90F19a7BB01498116b", // null price
  "0xeC744dae4d68735d5AEA5FDB766FcE51D9A256a5", // null price
  "0x6EAD9B5d7Ae26c12CC40E393749999CB1707af5f", // null price
  "0x694D5bfe9EC280708891B34ef17eA8A0d3a6B1aF", // null price
  "0x7532Bbf5ea43cc2B561893dd0f72a6Ac1E03f193", // null price
  "0x9d12adfbF8884D320Bc36393AF661DfFA3E78aB8", // null price
  "0x6dc8DA6c5dD94F3ACA1dDBd77fe482c0f428AfeF", // null price
  "0x5728F8613DB86F741a6aA1f8E3B290586435d276", // null price
  "0x6d3b2C9e3B208Cb0f8a20392FdeD04C55c33CE6E", // null price
  "0x0ca8DD915547c1Ba0EbE2a736d10aC079a259c10", // null price
  "0x2917999397b7c901C31DD20a06C5C1197A66A564", // null price
  "0x4C14cc99Bd8E7B696a0c6383023dcD4c98B70f62", // null price
  "0x6FCfa7c5F14de887d574895D04034FA179559c77", // null price
  "0x7646e21932C6769cf719d91c674Ad559B9Ef1cBD", // null price
  "0x758c9EB8927a1d80CA0391c34c45645f3abEc7ad", // null price
  // Governance
  "0x9ed2c155632C042CB8bC20634571fF1CA26f5742", // cJewel // null price??
  "0x6E7185872BCDf3F7a6cBbE81356e50DAFFB002d2", // xCrystal Retired
  "0x77f2656d04E158f915bC22f07B779D94c1DC47Ff", // xJewel Retired
  // Power TOkens
  "0x04b9dA42306B023f3572e106B11D82aAd9D32EBb", // Crytsal
  // Ecosystem
  "0xCCb93dABD71c8Dad03Fc4CE5559dC3D89F67a260", // JEWEL
  // Other tokens
  "0xB57B60DeBDB0b8172bb6316a9164bd3C695F133a", // AVAX (if we use it for bridging)
  "0x3AD9DFE640E1A9Cc1D9B0948620820D975c3803a", // USDC (has 18 decimals)
];

const getDFKTokenMetadata = async () => {
  const supportedTokens: any[] = [];
  const noPricesTokens: any[] = [];

  await Promise.all(
    ERC20TokensDFK.map(async (tokenAddress: string) => {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider
      );
      try {
        const tokenSymbol = await tokenContract.symbol();
        const tokenDecimals = await tokenContract.decimals();
        const tokenName = await tokenContract.name();
        const price = await getTokenPriceWithDexscreener(
          `usdc,${tokenAddress}`
        );
        if (!price) {
          noPricesTokens.push({
            name: tokenName,
            symbol: tokenSymbol,
            address: tokenAddress,
            decimals: tokenDecimals.toString(),
            price: price,
          });
        } else {
          supportedTokens.push({
            name: tokenName,
            symbol: tokenSymbol,
            address: tokenAddress,
            decimals: tokenDecimals.toString(),
            price: price,
          });
        }
      } catch (error) {
        console.error("Error en token:", tokenAddress, error);
      }
    })
  );

  console.log(supportedTokens);
  console.log("Without Price:", noPricesTokens);
};

/// ************************************************* ///
/// ************************************************* ///
/// **** UNCOMMENT THE FUNCTION YOU WANT TO TEST **** ///
/// ************************************************* ///
/// ************************************************* ///

//getBalance();
//sendNativeToken();
//sendERC20Token();
//getTxReceipt();

// covalentGetERC20Balances(
//   "0x8f444b150741d06d56931e4db73b0c9afa062ca3",
//   "defi-kingdoms-mainnet"
// );

// covalentGetNFTBalances(
//   "0x552c036572055541bdDE362A079d264f8a1245F5",
//   "defi-kingdoms-mainnet"
// );

//getDFKTokenMetadata();
//getDFKTokens();
