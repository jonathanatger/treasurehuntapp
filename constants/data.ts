export const domain = "https://treasurehunt-jet.vercel.app";

export type AppContextType = {
  userInfo: UserInfoType | null;
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfoType | null>>;
  AuthProvider: string | null;
  setIsFirstTime: React.Dispatch<React.SetStateAction<boolean>>;
};

export type UserInfoType = {
  email: string;
  family_name?: string;
  given_name?: string;
  id?: string;
  locale?: string;
  name?: string;
  picture?: string;
  verified_email?: string;
  provider?: string;
};
