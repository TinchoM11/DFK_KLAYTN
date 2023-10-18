import { ethers } from "ethers";
import dotenv from "dotenv";
import axios from "axios";
import { getPriceFromCoinMarketCap } from "./coinMarketCap";
import { getTokenPriceWithDexscreener } from "./dexScreener";
dotenv.config();

const ERC20_ABI = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

const NFT_ABI = [
  "function name() external view returns (string _name)",
  "function symbol() external view returns (string _symbol)",
  "function tokenURI(uint256 _tokenId) external view returns (string)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address _owner) external view returns (uint256)",
];

const DFK_PK = process.env.DFK_PK as string;
const KLAYTON_RPC = process.env.KLAYTON_RPC_MAINNET as string;
const provider = new ethers.providers.JsonRpcProvider(KLAYTON_RPC);

const ERC20TokensKlayton = [
  // Inventory
  "0x75E8D8676d774C9429FbB148b30E304b5542aC3d",
  "0xDbd4fA2D2C62C6c60957a126970e412Ed6AC1bD6",
  "0xEDFBe9EEf42FfAf8909EC9Ce0d79850BA0C232FE",
  "0xBcdD90034eB73e7Aec2598ea9082d381a285f63b",
  "0x80A42Dc2909C0873294c5E359e8DF49cf21c74E4",
  "0xE408814828f2b51649473c1a05B861495516B920",
  "0xf2D479DaEdE7F9e270a90615F8b1C52F3C487bC7",
  "0xc6030Afa09EDec1fd8e63a1dE10fC00E0146DaF3",
  "0xa61Bac689AD6867a605633520D70C49e1dCce853",
  "0x874FC0015ece1d77ba3D5668F16c46ba72913239",
  "0x08D93Db24B783F8eBb68D7604bF358F5027330A6",
  "0xCd2192521BD8e33559b0CA24f3260fE6A26C28e4",
  "0x7E1298EBF3a8B259561df6E797Ff8561756E50EA",
  // Gold Crops
  "0x72F860bF73ffa3FC42B97BbcF43Ae80280CFcdc3",
  "0x18cB286EeCE992f79f601E49acde1D1F5dE32a30",
  "0xD69542aBE74413242e387Efb9e55BE6A4863ca10",
  "0xeaF833A0Ae97897f6F69a728C9c17916296cecCA",
  "0xB4A516bf36e44c0CE9E3E6769D3BA87341Cd9959",
  "0xFceFA4Abcb18a7053393526f75Ad33fac5F25dc9",
  "0x4cD7025BD6e1b77105b90928362e6715101d0b5a",
  "0x8D2bC53106063A37bb3DDFCa8CfC1D262a9BDCeB",
  "0xadbF23Fe3B47857614940dF31B28179685aE9B0c",
  "0xCe370D379f0CCf746B3426E3BD3923f3aDF0DC1a",
  "0x7E121418cC5080C96d967cf6A033B0E541935097",
  "0x48d9fC80A47cee2d52DE950898Bc6aBF54223F81",
  // Raffle - Raffle Tickets are non-transferrable;
  // So they don't have a price
  "0x3E5081337d1a12F261b013Bc08745fB3cd756Eb3", // null price
  //Collectibles -- Collectible Items are non-transferrable
  // So they don't have a price
  "0xe52fceF6083e3d2E43D1113FC06caA6bAc9D3db9",
  "0xE7d77E157672864B500727551633E4Cc453964A9",
  "0x2C9A39E85D4b3900a63B903113DE103FB448e578",
  "0x1090ebCEaDDdA1e4dE6dE05a2C158751016b5a4b",
  "0x9428013ed7CEeeFFe97D3EceE43531781461dbFD",
  "0x576C7752989Ef12Ed4460E7297Ac78488056f8c6",
  "0x8B165dc793468422cd0C4C414f503bbBcded19Cd",
  "0x91469f593Ae5C47C953f9132Ed9b322Dd4baF75c",
  "0xCA30692b44d113364e6A0C06158194e642910B4D",
  "0xAdE8f21d33654444b0A6f01647994682eB69ab4e",
  "0x168cE065510c2494AAE61159B41B0abf70315eCF",
  "0x569cA77E2dCa320a6043f1365813cA1c72A5CeaD",
  // Governance
  "0xaA8548665bCC12C202d5d0C700093123F2463EA6", // sJEWEL
  // Power TOkens
  "0xB3F5867E277798b50ba7A71C0b24FDcA03045eDF", // JADE
  // Ecosystem
  "0x30C103f8f5A3A732DFe2dCE1Cc9446f545527b43", // JEWEL
  // Other tokens
  "0xe7a1B580942148451E47b92e95aEB8d31B0acA37", //  Gold (DFKGOLD)
  "0x8Be0cbA3c8c8F392408364ef21dfCF714A918234", // Gaia's Tears (DFKTEARS)
];

async function getKlayBalance(address: string) {
  console.log("----- Getting KLAY Balance -----");
  const klayBalance = await provider.getBalance(address);
  const formatBalance = ethers.utils.formatEther(klayBalance);
  console.log(`You have ${formatBalance} KLAY`);

  const KlayPrice = await getPriceFromCoinMarketCap("KLAY");
  console.log(`KLAY price: ${KlayPrice}`);
  const klayValue = Number(formatBalance) * KlayPrice;
  console.log(`Your KLAY value is ${klayValue}`);
}

const sendNativeToken = async () => {
  console.log("---------- Sending a Transaction of Native Token ----------");
  const walletWithBalance = new ethers.Wallet(DFK_PK, provider);
  console.log(
    "Balance Before Transfer:" +
      (await walletWithBalance.getBalance()).toString()
  );
  const amount = ethers.BigNumber.from("20000000000000000"); // 0.01 KLAY
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
    "0x30C103f8f5A3A732DFe2dCE1Cc9446f545527b43"; // JEWEL ON KTN
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

async function getTxReceipt(txHash: string) {
  console.log("----- Getting Tx Receipt -----");
  const receipt = await provider.getTransactionReceipt(txHash);
  console.log("Receipt of a Tx:", receipt);
}

async function getTokenInfo(tokenAddress: string) {
  const erc20Contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const symbol = await erc20Contract.symbol();
  const decimals = await erc20Contract.decimals();
  const name = await erc20Contract.name();
  console.log("----- Getting Token Metadata And Price -----");
  console.log(`Token address: ${tokenAddress}`);
  console.log(`Token name: ${name}`);
  console.log(`Token symbol: ${symbol}`);
  console.log(`Token decimals: ${decimals}`);
  const tokenPrice = await getTokenPriceWithDexscreener(`usdc,${tokenAddress}`);
  console.log(`Token price: ${tokenPrice}`);
}

const getERC20Balances = async (address: string) => {
  const balances: any[] = [];
  await Promise.all(
    ERC20TokensKlayton.map(async (tokenAddress: string) => {
      const erc20Contract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider
      );
      const balance = await erc20Contract.balanceOf(address);
      const symbol = await erc20Contract.symbol();
      const decimals = await erc20Contract.decimals();
      const formatBalance = ethers.utils.formatUnits(balance, decimals);
      const price = await getTokenPriceWithDexscreener(`usdc,${tokenAddress}`);
      const value = Number(formatBalance) * (price ?? 0);
      balances.push({
        symbol,
        balance: formatBalance,
        price,
        value,
      });
    })
  );
  console.log("------ ERC20 Balances -----");
  console.log(balances);
};

async function getERC20TokenBalancesWithAPI(address: string) {
  const url = `https://api-cypress.klaytnscope.com/v2/accounts/${address}/ftBalances`;
  const headers = {
    "accept-language": "en-US,en;q=0.9,es-ES;q=0.8,es;q=0.7",
    Referer: "https://scope.klaytn.com/",
  };

  try {
    const response = await axios.get(url, { headers });
    const { result } = response.data;

    // Usar Promise.all para hacer todas las solicitudes en paralelo
    const balancePromises = result.map(
      async (token: {
        tokenAddress: string;
        amount: string;
        address: string;
        createdAt: number;
        updatedAt: number;
      }) => {
        const erc20Contract = new ethers.Contract(
          token.tokenAddress,
          ERC20_ABI,
          provider
        );
        const symbol = await erc20Contract.symbol();
        const name = await erc20Contract.name();
        const decimals = await erc20Contract.decimals();
        const amountBigNum = ethers.BigNumber.from(token.amount);
        const balance =
          decimals !== 0
            ? ethers.utils.formatUnits(amountBigNum, decimals)
            : Number(token.amount);

        const price = await getTokenPriceWithDexscreener(
          `usdc,${token.tokenAddress}`
        );
        const value = Number(balance) * (price ?? 0);

        return {
          tokenAddress: token.tokenAddress,
          name,
          symbol,
          balance,
          price,
        };
      }
    );

    const tokenBalance = await Promise.all(balancePromises);
    console.log(tokenBalance);
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

async function getNFTsWithAPI(address: string) {
  const url = `https://api-cypress.klaytnscope.com/v2/accounts/${address}/kip17Balances`;
  const headers = {
    "accept-language": "en-US,en;q=0.9,es-ES;q=0.8,es;q=0.7",
    Referer: "https://scope.klaytn.com/",
  };

  try {
    const res = await axios.get(url, { headers });
    const NFTsList = res.data.result;
    const NFTsMetadata = res.data.tokens;

    const NFTPromises = NFTsList.map(async (NFT: any) => {
      const NFTAddress = NFT.tokenAddress;
      const NFTContract = new ethers.Contract(NFTAddress, NFT_ABI, provider);
      const name = await NFTContract.name();
      const symbol = await NFTContract.symbol();
      const imageBase64 = NFTsMetadata[NFTAddress].image;

      return {
        name,
        symbol,
        tokenAddress: NFTAddress,
        balance: Number(NFT.tokenCount),
        image: imageBase64,
      };
    });

    const NFTsBalance = await Promise.all(NFTPromises);
    console.log("------ NFTs Balance -----");
    console.log(NFTsBalance);
  } catch (error) {
    console.error("Error:", error);
  }
}

const getKlaytonTokenMetadata = async () => {
  const supportedTokens: any[] = [];
  const noPricesTokens: any[] = [];

  await Promise.all(
    ERC20TokensKlayton.map(async (tokenAddress: string) => {
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
const main = async () => {
  //await getKlayBalance("0x23eD50dB3e7469695DD30FFD22a7B42716A338FC");
  //await getERC20Balances("0x506f3039bff28e6882847bc272522a605f66754b"); // Calling each contract
  // await getERC20TokenBalancesWithAPI(
  //   "0x506f3039bff28e6882847bc272522a605f66754b"
  // );
  // await getNFTsWithAPI("0x506f3039bff28e6882847bc272522a605f66754b");
  // await sendNativeToken();
  //await sendERC20Token();
  // await getTokenInfo("0xDbd4fA2D2C62C6c60957a126970e412Ed6AC1bD6");
  // await getTxReceipt(
  //   "0xbe5871b34bad4b8fcd17b9d949a1a9054d850bec5ac713a23c99ca5d46cdc218"
  // );
  //await getKlaytonTokenMetadata();
};

main();
