const getUrl = () => {
  const url = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || "";
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `https://${url}`;
};

export const config = {
  n8nWebhookUrl: getUrl(),
};
