import { auth } from "../../../firebase";

export const callCommerceFunction = async (name, body = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to continue.");

  const token = await user.getIdToken();
  const response = await fetch(`/.netlify/functions/${name}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Commerce request failed.");
  }

  return payload;
};
