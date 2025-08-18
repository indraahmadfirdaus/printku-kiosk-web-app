// Service untuk proxy PDF
export const getProxiedPdfUrl = (originalUrl) => {
  const tunnelUrl = 'https://european-complicated-microwave-metal.trycloudflare.com';
  return `${tunnelUrl}/api/proxy-pdf?url=${encodeURIComponent(originalUrl)}`;
};