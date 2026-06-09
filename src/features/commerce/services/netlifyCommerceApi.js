import { getFunctions, httpsCallable } from "firebase/functions";

const fns = getFunctions();

// Converts "commerce-save-product" → "commerceSaveProduct"
const toFunctionName = (name) =>
  name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

export const callCommerceFunction = async (name, data = {}) => {
  const fnName = toFunctionName(name);
  const callable = httpsCallable(fns, fnName);
  const result = await callable(data);
  return result.data;
};
