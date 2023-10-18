import axios from "axios";

const COIN_MARKET_CAP_API_KEY = "0da71c42-1fc3-4044-86ad-8d71143e8056";

async function getCoinMarketCapTokenId(symbol: string) {
  const API_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/map";
  try {
    const tokenData = await axios.get(API_URL, {
      headers: {
        "X-CMC_PRO_API_KEY": COIN_MARKET_CAP_API_KEY as string,
      },
    });
    const tokenId = tokenData.data.data.find(
      (token: any) => token.symbol === symbol
    ).id;
    return tokenId;
  } catch (error) {
    throw new Error("Error getting Token Id from CoinMarketCap");
  }
}

//getCoinMarketCapTokenId("FLOW");

export const getPriceFromCoinMarketCap = async (
  symbol: string
): Promise<number> => {
  const id = await getCoinMarketCapTokenId(symbol);
  const API_URL = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=${id}`;
  try {
    const tokenData = await axios.get(API_URL, {
      headers: {
        "X-CMC_PRO_API_KEY": COIN_MARKET_CAP_API_KEY as string,
      },
    });
    const firstElement: any = Object.values(tokenData.data.data)[0];
    const unitPrice = firstElement.quote.USD.price.toFixed(6);
    return Number(unitPrice);
  } catch (error) {
    throw new Error("Error Token Price" + error);
  }
};
