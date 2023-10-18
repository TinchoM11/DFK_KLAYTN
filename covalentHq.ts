// @ts-nocheck
import axios from "axios";
import { BigNumber } from "ethers";
import { getTokenPriceWithDexscreener } from "./dexScreener";
require("dotenv").config();
const API_KEY = process.env.COVALENT_API_KEY;

export async function covalentGetERC20Balances(address: string, chain: string) {
  let tokenBalances: [
    address: string,
    tokenAddress: string,
    tokenSymbol: string,
    amount: BigNumber,
    price: number
  ] = [];
  const config = {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  };

  const COVALENT_ENDPOINT = `https://api.covalenthq.com/v1/${chain}/address/${address}/balances_v2/`;

  try {
    const res = await axios.get(COVALENT_ENDPOINT, config);
    const tokens = res.data.data.items;
    await Promise.all(
      tokens.map(async (token: any) => {
        if (token.supports_erc && token.supports_erc[0] === "erc20") {
          const price = await getTokenPriceWithDexscreener(
            `usdc,${token.contract_address}`
          );
          tokenBalances.push([
            address,
            token.contract_address,
            token.contract_ticker_symbol,
            BigNumber.from(token.balance),
            price * Number(token.balance),
          ]);
        }
      })
    );
    console.log("TOKENS:", JSON.stringify(tokens, null, 2))
    //console.log("ERC20 TOkens:", JSON.stringify(tokenBalances, null, 2));
  } catch (error) {
    console.log("Error:", error);
  }
}

export async function covalentGetNFTBalances(address: string, chain: string) {
  let nftBalances: [
    address: string | undefined,
    img: string | undefined,
    name: string | undefined,
    tokenType: string
  ] = [];

  const options = {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  };

  const queryParams = "no-spam=true&with-uncached=true";
  const url = `https://api.covalenthq.com/v1/${chain}/address/${address}/balances_nft/?${queryParams}`;
  try {
    const res = await axios.get(url, options);
    const totalNftTokens = res.data.data.items;
    totalNftTokens.map((token: any) => {
      const nftItems = token.nft_data;
      nftItems.forEach((nftItem: any) => {
        if (nftItem.external_data === null) return;
        nftBalances.push({
          address: token.contract_address,
          img: nftItem.external_data.image_512,
          name: nftItem.external_data.name,
          tokenType: "ERC721",
        });
      });
    });
    console.log("NFTs For Wallet:", nftBalances);
  } catch (error) {
    console.log("Error:", error);
  }
}

//covalentGetNFTBalances("0x256DC7A9CDDAc88c9C80AF0445eCEa056d2298dD");
//covalentGetERC20Balances("0xFe0200843C6798CfeE3d174ccF860f8BC1317815");
