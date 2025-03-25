import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Initial: undefined;
  FarmerLogin: undefined;
  FarmerSignup: undefined;
  VendorLogin: undefined;
  VendorSignup: undefined;
  FarmerMain: undefined;
  VendorMain: undefined;
};

export type FarmerTabParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  CartTab: undefined;
  ProfileTab: undefined;
};

export type FarmerStackParamList = {
  Main: NavigatorScreenParams<FarmerTabParamList>;
  ProductDetails: { productId: string };
  FarmerChat: { vendorId: string; vendorName: string };
  OrderDelivery: {
    orderId: string;
    productImages: string[];
  };
};

export type VendorTabParamList = {
  DashboardTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

export type VendorStackParamList = {
  Main: NavigatorScreenParams<VendorTabParamList>;
};
