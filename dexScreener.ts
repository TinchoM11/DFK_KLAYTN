import axios from "axios";

export const getTokenPriceWithDexscreener = async (tokenAddress: string) => {
  const API_URL = `https://api.dexscreener.com/latest/dex/tokens/:${tokenAddress}`;
  try {
    const res = await axios.get(API_URL);
    // Return the price but as a number, not string
    //console.log(res.data.pairs)
    return Number(res.data.pairs[0].priceUsd);
  } catch (error) {
    return null;
  }
};

//getTokenPriceWithDexscreener("usdc,0xBcdD90034eB73e7Aec2598ea9082d381a285f63b");
