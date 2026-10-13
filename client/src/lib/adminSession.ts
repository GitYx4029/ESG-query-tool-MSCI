export const PASSWORD_KEY = "esg-admin-session";
export const matchesUiPassword = (password: string) => password === "4029";
export const getAdminPassword = () =>
  sessionStorage.getItem(PASSWORD_KEY) || "";

export const getServiceToken = () =>
  sessionStorage.getItem("esg-ai-service-token") || "";
export const getCommunityToken = () =>
  sessionStorage.getItem("esg-community-admin-token") || "";
