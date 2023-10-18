import { BigNumber, ethers } from "ethers";
import dotenv from "dotenv";
import { checkAndSetAllowanceKlaytn } from "./approveTxKTN";
dotenv.config();

const KlaytnProvider = new ethers.providers.JsonRpcProvider(
  process.env.KLAYTON_RPC_MAINNET as string
);

const WALLET_PK = process.env.DFK_PK as string;
const wallet = new ethers.Wallet(WALLET_PK, KlaytnProvider);

const uniswapRouterAddress = "0x9e987E5E9aB872598f601BE4aCC5ac23F484845E"; // KLAYTN Uniswap Router
const jewelAddress = "0x30C103f8f5A3A732DFe2dCE1Cc9446f545527b43"; // jewl on klaytn is an ERC20
const klayAddressWETH = "0x19Aac5f612f524B754CA7e7c41cbFa2E981A4432"; // WETH on UNISWAPV2
// We use this WETH address because the router is configured to use it as the native token
// It will automatically convert it to native token (Klay) when sapping TO WETH
// It will automatically convert Klay to WETH when swapping FROM WETH

const ERC20_ABI = [
  // Read-Only Functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
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
    KlaytnProvider
  );

  const toTokenContract = new ethers.Contract(
    toTokenAddress,
    ERC20_ABI,
    KlaytnProvider
  );

  const fromTokenSymbol = await fromTokenContract.symbol();
  const toTokenSymbol = await toTokenContract.symbol();
  const toTokenDecimals = await toTokenContract.decimals();

  const path = [fromTokenAddress, toTokenAddress];
  try {
    const amounts = await uniswapRouterConnection.getAmountsOut(
      amountToSwap,
      path
    );
    if (amounts && amounts.length >= 2) {
      const toTokenAmount = ethers.utils.formatEther(amounts[1]);
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
    KlaytnProvider
  );

  const toTokenContract = new ethers.Contract(
    toTokenAddress,
    ERC20_ABI,
    KlaytnProvider
  );

  const fromTokenSymbol = await fromTokenContract.symbol();
  const fromTokenDecimals = await fromTokenContract.decimals();

  const toTokenSymbol = await toTokenContract.symbol();

  const amountToSwap = ethers.utils.parseUnits(amountIn, fromTokenDecimals); // Amount Of FROM TOKEN
  const amountOut = await getAmountOut({
    fromTokenAddress,
    toTokenAddress,
    amountToSwap,
  });

  const amountOutMin = amountOut.mul(98).div(100); // 2% slippage
  const path = [fromTokenAddress, toTokenAddress];
  const to = receiverAddress; // Address to send the swapped tokens
  const deadline = Math.floor(Date.now() / 1000) + 60 * 30; // 30 min from now

  console.log(
    `Swapping ${amountToSwap} ${fromTokenSymbol} for ${amountOutMin} ${toTokenSymbol}`
  );
  try {
    // We nneed to approve the router to spend the tokens
    await checkAndSetAllowanceKlaytn(
      fromTokenAddress,
      uniswapRouterAddress, // UNISWAP ROUTER
      amountToSwap
    );

    /// ****** IN THE SECTION BELOW YOU CAN CHOOSE THE FUNCTION TO USE ******* ///
    /// ********************************************************************** ///
    /// ********** COMMENT / UNCOMMENT THE FUNCTION YOU WANT TO USE ********** ///
    /// ********************************************************************** ///
    /// ********************************************************************** ///

    // USE the SwapExactTokensForETH FUNCTION TO SWAP TOKENS FOR NATIVE TOKEN (KLAY),
    // const tx = await uniswapRouterConnection.swapExactTokensForETH(
    //   amountToSwap,
    //   amountOutMin,
    //   path,
    //   to,
    //   deadline,
    //   { gasLimit: 210000 }
    // );

    // USE the SwapExactETHForTokens FUNCTION TO SWAP NATIVE TOKENS (klay) FOR TOKENS
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
  fromTokenAddress: klayAddressWETH,
  toTokenAddress: jewelAddress,
  receiverAddress: "0x23eD50dB3e7469695DD30FFD22a7B42716A338FC",
  amountIn: "1",
});
