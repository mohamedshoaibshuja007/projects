export type RootStackParamList = {
  InitialSelection: undefined;
  FarmerLogin: undefined;
  FarmerSignUp: undefined;
  FarmerForgotPassword: undefined;
  VendorLogin: undefined;
  VendorSignup: undefined;
  VendorForgotPassword: undefined;
  FarmerNavigator: undefined;
  VendorNavigator: undefined;
  FarmerChat: { vendorId: string; vendorName: string };
  VendorChat: { farmerId: string; farmerName: string };
  ProductDetails: { productId: string };
};

export type FarmerTabParamList = {
  Home: undefined;
  Cart: undefined;
  Orders: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type VendorTabParamList = {
  Home: undefined;
  Products: undefined;
  Orders: undefined;
  Messages: undefined;
  Profile: undefined;
};
