import { BigNumber, ethers } from "ethers";
import dotenv from "dotenv";
import { checkAndSetAllowance } from "./approveTxDFK";
dotenv.config();

const DFK_RPC = process.env.DFK_RPC_MAINNET as string;
const DKFProvider = new ethers.providers.JsonRpcProvider(DFK_RPC);

const WALLET_PK = process.env.DFK_PK as string;
const wallet = new ethers.Wallet(WALLET_PK, DKFProvider);

const uniswapRouterAddress = "0x3C351E1afdd1b1BC44e931E12D4E05D6125eaeCa"; // DFK Uniswap Router
const avaxAddress = "0xB57B60DeBDB0b8172bb6316a9164bd3C695F133a";
const usdcAddress = "0x3AD9DFE640E1A9Cc1D9B0948620820D975c3803a";
const WJewelAddress = "0xCCb93dABD71c8Dad03Fc4CE5559dC3D89F67a260"; // WJewel
// We use this WJewel address because the router is configured to use it as the native token
// It will automatically convert it to native token (Jewel) when swapping TO WJewel
// It will automatically convert Jewel to WJewel when swapping FROM WJewel

const ERC20_ABI = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

const UNISWAPV2_ABI = [
  "function getAmountsOut(uint256, address[]) view returns (uint256[])",
  "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint deadline)",
  "function swapExactTokensForETH(uint256 amountIn, uint amountOutMin, address[] path, address to, uint deadline)",
  "function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint256[])",
];

const uniswapRouterConnection = new ethers.Contract(
  uniswapRouterAddress,
  UNISWAPV2_ABI,
  wallet
);

// Function to get the amount of JEWEL you would get if you swap X quantity of AVAX
async function getAmountOut({
  fromTokenAddress,
  toTokenAddress,
  amountToSwap,
}: {
  fromTokenAddress: string;
  toTokenAddress: string;
  amountToSwap: BigNumber;
}) {
  const fromTokenContract = new ethers.Contract(
    fromTokenAddress,
    ERC20_ABI,
    DKFProvider
  );

  const toTokenContract = new ethers.Contract(
    toTokenAddress,
    ERC20_ABI,
    DKFProvider
  );

  const fromTokenSymbol = await fromTokenContract.symbol();
  const toTokenSymbol = await toTokenContract.symbol();
  const toTokenDecimals = await toTokenContract.decimals();
  console.log("To TOken Decimals:", toTokenDecimals);

  const path = [fromTokenAddress, toTokenAddress];
  try {
    const amounts = await uniswapRouterConnection.getAmountsOut(
      amountToSwap,
      path
    );
    if (amounts && amounts.length >= 2) {
      const toTokenAmount = ethers.utils.formatUnits(
        amounts[1],
        toTokenDecimals
      );
      console.log(
        `You will get ${toTokenAmount} swapping ${amountToSwap.toString()} ${fromTokenSymbol} to ${toTokenSymbol}.`
      );
      return ethers.utils.parseUnits(toTokenAmount, toTokenDecimals);
    }
  } catch (error) {
    console.error("Error while getting swap information", error);
    throw error;
  }

  return BigNumber.from(0);
}

async function swapTokens({
  fromTokenAddress,
  toTokenAddress,
  receiverAddress,
  amountIn,
}: {
  fromTokenAddress: string;
  toTokenAddress: string;
  receiverAddress: string;
  amountIn: string;
}) {
  const fromTokenContract = new ethers.Contract(
    fromTokenAddress,
    ERC20_ABI,
    DKFProvider
  );

  const toTokenContract = new ethers.Contract(
    toTokenAddress,
    ERC20_ABI,
    DKFProvider
  );

  const fromTokenSymbol = await fromTokenContract.symbol();
  const fromTokenDecimals = await fromTokenContract.decimals();

  const toTokenSymbol = await toTokenContract.symbol();
  console.log("From Token Decimals: ", fromTokenDecimals);
  console.log("To TOken Decimals: ", await toTokenContract.decimals());
  const amountToSwap = ethers.utils.parseUnits(amountIn, fromTokenDecimals); // Amount Of FROM TOKEN
  const amountOut = await getAmountOut({
    fromTokenAddress,
    toTokenAddress,
    amountToSwap,
  });

  const amountOutMin = amountOut.mul(97).div(100); // 3% slippage
  const path = [fromTokenAddress, toTokenAddress];
  const to = receiverAddress; // Address to send the swapped tokens
  const deadline = Math.floor(Date.now() / 1000) + 60 * 30; // 30 min from now

  console.log(
    `Swapping ${amountToSwap} ${fromTokenSymbol} for ${amountOutMin} ${toTokenSymbol}`
  );
  try {
    // We nneed to approve the router to spend the tokens
    await checkAndSetAllowance(
      fromTokenAddress,
      uniswapRouterAddress, // UNISWAP ROUTER
      amountToSwap
    );
    console.log("Allowance set");

    /// ****** IN THE SECTION BELOW YOU CAN CHOOSE THE FUNCTION TO USE ******* ///
    /// ********************************************************************** ///
    /// ********** COMMENT / UNCOMMENT THE FUNCTION YOU WANT TO USE ********** ///
    /// ********************************************************************** ///
    /// ********************************************************************** ///

    // USE the SwapExactTokensForETH FUNCTION TO SWAP TOKENS FOR NATIVE TOKEN (jewel),
    // const tx = await uniswapRouterConnection.swapExactTokensForETH(
    //   amountToSwap,
    //   amountOutMin,
    //   path,
    //   to,
    //   deadline,
    //   { gasLimit: 210000 }
    // );

    // USE the SwapExactETHForTokens FUNCTION TO SWAP NATIVE TOKENS (jewel) FOR TOKENS
    const tx = await uniswapRouterConnection.swapExactETHForTokens(
      amountOutMin,
      path,
      to,
      deadline,
      { gasLimit: 210000, value: amountToSwap }
    );

    // USE the SwapExactTokensForTokens FUNCTION TO SWAP BETWEEN ERC20 TOKENS
    // const tx = await uniswapRouterConnection.swapExactTokensForTokens(
    //   amountToSwap,
    //   amountOutMin,
    //   path,
    //   to,
    //   deadline,
    //   { gasLimit: 210000 }
    // );

    const receipt = await tx.wait();
    console.log(`Successfull transaction. TxHash: ${receipt.transactionHash}`);
  } catch (error) {
    console.error("Error performing swap tx:", error);
  }
}

swapTokens({
  fromTokenAddress: WJewelAddress,
  toTokenAddress: usdcAddress,
  receiverAddress: "0x23eD50dB3e7469695DD30FFD22a7B42716A338FC",
  amountIn: "4",
});
