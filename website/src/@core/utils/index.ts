import {ethers} from "ethers";

export const handleCopy = (text) => {
  if (!navigator.clipboard) {
    console.log('Async: Could not copy text: ');
    return;
  }
  if (!text) {
    console.log('Async: Could not copy text: ');
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    // console.log('Async: Copying to clipboard was successful!');
  });
};

export const genNewPk = () => {
  const wallet = ethers.Wallet.createRandom();
  const privateKey = wallet.privateKey;
  const address = wallet.address;
  return {privateKey, address};
}
